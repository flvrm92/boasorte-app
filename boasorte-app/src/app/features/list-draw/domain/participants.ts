/** Same limits and rules as the API (spec 001, FR-001/FR-003/FR-004; plan > Regras de domínio). */
export const MAX_PARTICIPANT_LENGTH = 200;
export const MAX_ENTRIES = 10_000;

export interface NormalizedParticipants {
  /** Eligible participants, trimmed, in their original order. */
  readonly eligible: string[];
  /** Entries received, including blank lines. */
  readonly submittedCount: number;
  /** Indexes (in the submitted entries) longer than {@link MAX_PARTICIPANT_LENGTH} after trimming. */
  readonly tooLongIndexes: number[];
  readonly tooMany: boolean;
}

export function normalizeParticipants(entries: readonly string[], removeDuplicates: boolean): NormalizedParticipants {
  const eligible: string[] = [];
  const tooLongIndexes: number[] = [];
  const seen = new Set<string>();

  entries.forEach((entry, index) => {
    const value = entry.trim();
    if (value.length === 0) return;

    if (value.length > MAX_PARTICIPANT_LENGTH) {
      tooLongIndexes.push(index);
      return;
    }

    // Case-insensitive, accent-sensitive; the API uses ToLowerInvariant for the same key.
    const key = value.toLowerCase();
    if (removeDuplicates && seen.has(key)) return;
    seen.add(key);
    eligible.push(value);
  });

  return { eligible, submittedCount: entries.length, tooLongIndexes, tooMany: entries.length > MAX_ENTRIES };
}

export function splitLines(text: string): string[] {
  return text.length === 0 ? [] : text.split(/\r?\n/);
}
