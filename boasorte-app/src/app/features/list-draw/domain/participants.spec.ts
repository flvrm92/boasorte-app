import sharedCases from '../../../../../../specs/001-sorteio-lista/contracts/normalization-cases.json';
import { MAX_ENTRIES, MAX_PARTICIPANT_LENGTH, normalizeParticipants, splitLines } from './participants';

describe('normalizeParticipants', () => {
  // Source of truth shared with the API tests (spec 001, plan > Regras de domínio).
  it.each(sharedCases.cases.map(c => [c.name, c] as const))('%s', (_, c) => {
    const result = normalizeParticipants(c.input, c.removeDuplicates);

    expect(result.eligible).toEqual(c.expected);
    expect(result.submittedCount).toBe(c.input.length);
  });

  it('reports every entry that is too long by index', () => {
    const tooLong = 'x'.repeat(MAX_PARTICIPANT_LENGTH + 1);

    const result = normalizeParticipants(['Ana', tooLong, 'Bruno', tooLong], false);

    expect(result.tooLongIndexes).toEqual([1, 3]);
    expect(result.eligible).toEqual(['Ana', 'Bruno']);
  });

  it('accepts exactly the maximum length after trimming', () => {
    const atLimit = ` ${'x'.repeat(MAX_PARTICIPANT_LENGTH)} `;

    expect(normalizeParticipants([atLimit], false).tooLongIndexes).toEqual([]);
  });

  it('flags lists with more entries than allowed', () => {
    const entries = Array.from({ length: MAX_ENTRIES + 1 }, (_, i) => `P${i}`);

    expect(normalizeParticipants(entries, false).tooMany).toBe(true);
    expect(normalizeParticipants(entries.slice(1), false).tooMany).toBe(false);
  });
});

describe('splitLines', () => {
  it('splits on LF and CRLF', () => {
    expect(splitLines('Ana\r\nBruno\nCarla')).toEqual(['Ana', 'Bruno', 'Carla']);
  });

  it('returns no entries for empty text', () => {
    expect(splitLines('')).toEqual([]);
  });
});
