// HTTP contract v1 — specs/001-sorteio-lista/contracts/api.md.

export type DrawKind = 'list' | 'range';

export interface RangeDto {
  start: number;
  end: number;
}

export interface CreateDrawRequest {
  title?: string | null;
  kind: DrawKind;
  participants?: string[];
  range?: RangeDto;
  removeDuplicates?: boolean;
  winnersCount: number;
  showParticipants?: boolean;
}

export interface WinnerDto {
  position: number;
  value: string;
}

export interface DrawResponse {
  publicId: string;
  title: string | null;
  kind: DrawKind;
  createdAt: string;
  expiresAt: string;
  settings: {
    removeDuplicates: boolean;
    winnersCount: number;
    showParticipants: boolean;
    range: RangeDto | null;
  };
  submittedCount: number;
  eligibleCount: number;
  winners: WinnerDto[];
  participants: string[] | null;
}

/** Failures the UI knows how to explain. */
export type DrawApiError =
  | { kind: 'validation'; fieldErrors: Record<string, string[]> }
  | { kind: 'not-found' }
  | { kind: 'expired' }
  | { kind: 'too-large' }
  | { kind: 'rate-limited'; message: string }
  | { kind: 'unavailable' };
