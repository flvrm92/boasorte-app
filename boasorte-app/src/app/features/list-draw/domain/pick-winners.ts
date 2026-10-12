/** Source of uniform random integers in [0, maxExclusive). */
export interface RandomSource {
  nextInt(maxExclusive: number): number;
}

const UINT32_RANGE = 2 ** 32;

/** Web Crypto backed, unbiased (rejection sampling). Never use Math.random for draws (constitution §1). */
export const cryptoRandom: RandomSource = {
  nextInt(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > UINT32_RANGE) {
      throw new RangeError(`maxExclusive must be an integer in [1, 2^32], got ${maxExclusive}`);
    }

    const limit = UINT32_RANGE - (UINT32_RANGE % maxExclusive);
    const buffer = new Uint32Array(1);
    do crypto.getRandomValues(buffer);
    while (buffer[0] >= limit);
    return buffer[0] % maxExclusive;
  },
};

/**
 * Picks `sampleSize` distinct indexes of [0, populationSize) uniformly and in uniformly random order — the same
 * algorithm as the API's WinnerSampler: Floyd's selection (O(k), no materialization) then a Fisher–Yates shuffle.
 */
export function sampleIndexes(populationSize: number, sampleSize: number, random: RandomSource = cryptoRandom): number[] {
  if (!Number.isInteger(populationSize) || populationSize < 1) {
    throw new RangeError(`populationSize must be a positive integer, got ${populationSize}`);
  }
  if (!Number.isInteger(sampleSize) || sampleSize < 1 || sampleSize > populationSize) {
    throw new RangeError(`sampleSize must be in [1, ${populationSize}], got ${sampleSize}`);
  }

  const selected = new Set<number>();
  const picks: number[] = [];
  for (let j = populationSize - sampleSize; j < populationSize; j++) {
    const candidate = random.nextInt(j + 1);
    const pick = selected.has(candidate) ? j : candidate;
    selected.add(pick);
    picks.push(pick);
  }

  for (let i = picks.length - 1; i > 0; i--) {
    const swap = random.nextInt(i + 1);
    [picks[i], picks[swap]] = [picks[swap], picks[i]];
  }

  return picks;
}
