import { cryptoRandom, RandomSource, sampleIndexes } from './pick-winners';

/** Returns queued values, failing loudly when one is out of the requested range. */
function sequence(...values: number[]): RandomSource {
  return {
    nextInt(maxExclusive) {
      const value = values.shift();
      if (value === undefined) throw new Error('sequence ran out of values');
      if (value < 0 || value >= maxExclusive) throw new Error(`${value} is outside [0, ${maxExclusive})`);
      return value;
    },
  };
}

/** Deterministic PRNG (mulberry32) for statistical tests. Never used in production code. */
function seeded(seed: number): RandomSource {
  let state = seed >>> 0;
  return {
    nextInt(maxExclusive) {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * maxExclusive);
    },
  };
}

describe('sampleIndexes', () => {
  it('returns the requested number of distinct indexes within the population', () => {
    const picks = sampleIndexes(10, 4, seeded(1));

    expect(picks).toHaveLength(4);
    expect(new Set(picks).size).toBe(4);
    expect(picks.every(i => i >= 0 && i < 10)).toBe(true);
  });

  it('sampling the whole population returns a permutation', () => {
    expect([...sampleIndexes(6, 6, seeded(2))].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('follows Floyd selection then shuffles the order (same as the API)', () => {
    // n=5, k=2: j=3 picks 1; j=4 picks 1 again (taken) so takes 4 => [1, 4]; shuffle swaps => [4, 1].
    expect(sampleIndexes(5, 2, sequence(1, 1, 0))).toEqual([4, 1]);
  });

  it('handles huge populations without materializing them', () => {
    const population = 2_000_000_001;

    const picks = sampleIndexes(population, 1000, seeded(3));

    expect(new Set(picks).size).toBe(1000);
    expect(Math.max(...picks)).toBeLessThan(population);
  });

  it('gives every participant the same chance to win', () => {
    const random = seeded(42);
    const hits = [0, 0, 0, 0, 0];

    for (let run = 0; run < 10_000; run++) hits[sampleIndexes(5, 1, random)[0]]++;

    expect(hits.every(h => h > 1_800 && h < 2_200)).toBe(true); // 2,000 expected, ±10%
  });

  it('gives every participant the same chance to be first place', () => {
    const random = seeded(7);
    const firstPlace = [0, 0, 0];

    for (let run = 0; run < 30_000; run++) firstPlace[sampleIndexes(3, 2, random)[0]]++;

    expect(firstPlace.every(h => h > 9_000 && h < 11_000)).toBe(true); // 10,000 expected, ±10%
  });

  it.each([
    [0, 1],
    [5, 0],
    [5, 6],
  ])('rejects invalid sizes (population %i, sample %i)', (population, sample) => {
    expect(() => sampleIndexes(population, sample, seeded(0))).toThrow(RangeError);
  });
});

describe('cryptoRandom', () => {
  it.each([1, 7, 62, 2 ** 31, 2_000_000_001, 2 ** 32])('stays within [0, %i)', max => {
    for (let i = 0; i < 2_000; i++) {
      const value = cryptoRandom.nextInt(max);
      expect(Number.isInteger(value) && value >= 0 && value < max).toBe(true);
    }
  });

  it('rejects ranges it cannot sample without bias', () => {
    expect(() => cryptoRandom.nextInt(0)).toThrow(RangeError);
    expect(() => cryptoRandom.nextInt(2 ** 32 + 1)).toThrow(RangeError);
  });
});
