import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DrawApi } from '../../core/api/draw-api';
import { CreateDrawRequest, DrawApiError, DrawKind, DrawResponse } from '../../core/api/draw.models';
import { MAX_ENTRIES, MAX_PARTICIPANT_LENGTH, normalizeParticipants, splitLines } from './domain/participants';
import { cryptoRandom, RandomSource, sampleIndexes } from './domain/pick-winners';

export const MAX_WINNERS = 1000;
export const MAX_TITLE_LENGTH = 120;
export const RANGE_LIMIT = 1_000_000_000;

/** Quick draws happen in the browser and can be repeated; official draws are made and stored by the server. */
export type DrawResult = { kind: 'quick'; winners: string[] } | { kind: 'official'; draw: DrawResponse };

const number = new Intl.NumberFormat('pt-BR');

/** State and rules of the list draw screen (spec 001). Provided by the page; its components share it. */
@Injectable()
export class ListDrawStore {
  private readonly api = inject(DrawApi);

  // Inputs
  readonly mode = signal<DrawKind>('list');
  readonly listText = signal('');
  readonly rangeStart = signal<number | null>(1);
  readonly rangeEnd = signal<number | null>(100);
  readonly title = signal('');
  readonly winnersCount = signal<number | null>(1);
  readonly removeDuplicates = signal(true);
  readonly showParticipants = signal(true);

  // Outcome
  readonly result = signal<DrawResult | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  private readonly entries = computed(() => splitLines(this.listText()));
  private readonly normalized = computed(() => normalizeParticipants(this.entries(), this.removeDuplicates()));

  readonly entryCount = computed(() => this.entries().length);

  readonly listError = computed(() => {
    const { tooMany, tooLongIndexes } = this.normalized();
    if (tooMany) return `A lista pode ter no máximo ${number.format(MAX_ENTRIES)} participantes.`;
    if (tooLongIndexes.length) return `A linha ${tooLongIndexes[0] + 1} passa de ${MAX_PARTICIPANT_LENGTH} caracteres.`;
    return null;
  });

  readonly rangeError = computed(() => {
    const start = this.rangeStart();
    const end = this.rangeEnd();
    if (start === null || end === null) return 'Informe o início e o fim do intervalo.';
    if (Math.abs(start) > RANGE_LIMIT || Math.abs(end) > RANGE_LIMIT) {
      return `Use números entre ${number.format(-RANGE_LIMIT)} e ${number.format(RANGE_LIMIT)}.`;
    }
    return start > end ? 'O início deve ser menor ou igual ao fim.' : null;
  });

  readonly eligibleCount = computed(() => {
    if (this.mode() === 'list') return this.normalized().eligible.length;
    return this.rangeError() ? 0 : this.rangeEnd()! - this.rangeStart()! + 1;
  });

  readonly winnersError = computed(() => {
    const count = this.winnersCount();
    if (count === null || count < 1) return 'Sorteie pelo menos 1 ganhador.';
    if (count > MAX_WINNERS) return `O máximo é ${number.format(MAX_WINNERS)} ganhadores.`;

    const eligible = this.eligibleCount();
    if (eligible === 0) return this.mode() === 'list' ? 'Adicione participantes para sortear.' : null;
    if (count > eligible) {
      return eligible === 1 ? 'Há apenas 1 participante elegível.' : `Há apenas ${number.format(eligible)} participantes elegíveis.`;
    }
    return null;
  });

  readonly titleError = computed(() =>
    this.title().trim().length > MAX_TITLE_LENGTH ? `O título deve ter no máximo ${MAX_TITLE_LENGTH} caracteres.` : null,
  );

  readonly canDraw = computed(
    () =>
      !this.winnersError() &&
      !this.titleError() &&
      this.eligibleCount() > 0 &&
      (this.mode() === 'list' ? !this.listError() : !this.rangeError()),
  );

  readonly winners = computed(() => {
    const result = this.result();
    if (!result) return [];
    return result.kind === 'quick' ? result.winners : result.draw.winners.map(w => w.value);
  });

  /** Spec 001, FR-008: repeatable while not saved. */
  quickDraw(random: RandomSource = cryptoRandom): void {
    if (!this.canDraw()) return;

    const picks = sampleIndexes(this.eligibleCount(), this.winnersCount()!, random);
    const eligible = this.normalized().eligible;
    const winners =
      this.mode() === 'list' ? picks.map(i => eligible[i]) : picks.map(i => String(this.rangeStart()! + i));

    this.result.set({ kind: 'quick', winners });
    this.saveError.set(null);
  }

  /** Spec 001, FR-012: the server makes a new draw and stores it; the browser never sends a result. */
  async saveOfficial(): Promise<void> {
    if (!this.canDraw() || this.saving()) return;

    this.saving.set(true);
    this.saveError.set(null);
    try {
      const draw = await firstValueFrom(this.api.create(this.request()));
      this.result.set({ kind: 'official', draw });
    } catch (error) {
      this.saveError.set(describe(error as DrawApiError));
    } finally {
      this.saving.set(false);
    }
  }

  private request(): CreateDrawRequest {
    const common = {
      title: this.title().trim() || null,
      winnersCount: this.winnersCount()!,
      showParticipants: this.showParticipants(),
    };

    return this.mode() === 'list'
      ? { ...common, kind: 'list', participants: this.entries(), removeDuplicates: this.removeDuplicates() }
      : { ...common, kind: 'range', range: { start: this.rangeStart()!, end: this.rangeEnd()! } };
  }
}

function describe(error: DrawApiError): string {
  switch (error.kind) {
    case 'validation':
      return Object.values(error.fieldErrors)[0]?.[0] ?? 'Revise os dados do sorteio.';
    case 'rate-limited':
      return error.message;
    case 'too-large':
      return 'A lista é grande demais para salvar. Use no máximo 10.000 participantes.';
    default:
      return 'Não foi possível salvar agora. Verifique sua conexão e tente de novo.';
  }
}
