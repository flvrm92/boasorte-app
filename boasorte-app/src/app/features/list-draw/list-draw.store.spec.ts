import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DrawResponse } from '../../core/api/draw.models';
import { RandomSource } from './domain/pick-winners';
import { ListDrawStore } from './list-draw.store';

function sequence(...values: number[]): RandomSource {
  return { nextInt: () => values.shift()! };
}

const saved: DrawResponse = {
  publicId: 'aZ3k9QpL0xYt',
  title: null,
  kind: 'list',
  createdAt: '2026-10-12T18:22:05Z',
  expiresAt: '2027-10-12T18:22:05Z',
  settings: { removeDuplicates: true, winnersCount: 1, showParticipants: true, range: null },
  submittedCount: 3,
  eligibleCount: 2,
  winners: [{ position: 1, value: 'Bruno' }],
  participants: ['Ana', 'Bruno'],
};

describe('ListDrawStore', () => {
  let store: ListDrawStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ListDrawStore, provideHttpClient(), provideHttpClientTesting()] });
    store = TestBed.inject(ListDrawStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('list', () => {
    it('counts entries and eligible participants', () => {
      store.listText.set('Ana\nana\n\nBruno');

      expect(store.entryCount()).toBe(4);
      expect(store.eligibleCount()).toBe(2);

      store.removeDuplicates.set(false);
      expect(store.eligibleCount()).toBe(3);
    });

    it('explains entries that are too long', () => {
      store.listText.set(`Ana\n${'x'.repeat(201)}`);

      expect(store.listError()).toBe('A linha 2 passa de 200 caracteres.');
      expect(store.canDraw()).toBe(false);
    });

    it('explains lists that are too big', () => {
      store.listText.set(Array.from({ length: 10_001 }, (_, i) => `P${i}`).join('\n'));

      expect(store.listError()).toBe('A lista pode ter no máximo 10.000 participantes.');
    });
  });

  describe('range', () => {
    beforeEach(() => store.mode.set('range'));

    it('counts numbers in the range', () => {
      store.rangeStart.set(1);
      store.rangeEnd.set(500);

      expect(store.eligibleCount()).toBe(500);
    });

    it.each([
      [null, 10, 'Informe o início e o fim do intervalo.'],
      [10, 1, 'O início deve ser menor ou igual ao fim.'],
      [-1_000_000_001, 1, 'Use números entre -1.000.000.000 e 1.000.000.000.'],
    ])('rejects %s..%s', (start, end, message) => {
      store.rangeStart.set(start);
      store.rangeEnd.set(end);

      expect(store.rangeError()).toBe(message);
      expect(store.eligibleCount()).toBe(0);
    });
  });

  describe('winners count', () => {
    beforeEach(() => store.listText.set('Ana\nBruno'));

    it.each([
      [0, 'Sorteie pelo menos 1 ganhador.'],
      [null, 'Sorteie pelo menos 1 ganhador.'],
      [1001, 'O máximo é 1.000 ganhadores.'],
      [3, 'Há apenas 2 participantes elegíveis.'],
    ])('%s → %s', (count, message) => {
      store.winnersCount.set(count);

      expect(store.winnersError()).toBe(message);
      expect(store.canDraw()).toBe(false);
    });

    it('asks for participants when there are none', () => {
      store.listText.set('');

      expect(store.winnersError()).toBe('Adicione participantes para sortear.');
    });
  });

  it('rejects titles longer than 120 characters', () => {
    store.title.set('x'.repeat(121));

    expect(store.titleError()).toBe('O título deve ter no máximo 120 caracteres.');
  });

  describe('quick draw', () => {
    it('draws winners from the eligible list', () => {
      store.listText.set('Ana\nBruno\nCarla');
      store.winnersCount.set(1);

      store.quickDraw(sequence(1));

      expect(store.winners()).toEqual(['Bruno']);
      expect(store.result()).toEqual({ kind: 'quick', winners: ['Bruno'] });
    });

    it('draws numbers from the range', () => {
      store.mode.set('range');
      store.rangeStart.set(10);
      store.rangeEnd.set(20);
      store.winnersCount.set(1);

      store.quickDraw(sequence(5));

      expect(store.winners()).toEqual(['15']);
    });

    it('does nothing while the form is invalid', () => {
      store.winnersCount.set(5);
      store.listText.set('Ana');

      store.quickDraw(sequence(0));

      expect(store.result()).toBeNull();
    });
  });

  describe('official draw', () => {
    it('sends the list draw and keeps the official result', async () => {
      store.listText.set(' Ana\nBruno\nana');
      store.title.set('  Rifa ');
      store.winnersCount.set(1);

      const done = store.saveOfficial();
      expect(store.saving()).toBe(true);
      const req = http.expectOne('/api/v1/draws');
      expect(req.request.body).toEqual({
        title: 'Rifa',
        kind: 'list',
        participants: [' Ana', 'Bruno', 'ana'],
        removeDuplicates: true,
        winnersCount: 1,
        showParticipants: true,
      });
      req.flush(saved, { status: 201, statusText: 'Created' });
      await done;

      expect(store.saving()).toBe(false);
      expect(store.result()).toEqual({ kind: 'official', draw: saved });
      expect(store.winners()).toEqual(['Bruno']);
    });

    it('sends the range draw without participants', async () => {
      store.mode.set('range');
      store.rangeStart.set(1);
      store.rangeEnd.set(500);
      store.winnersCount.set(2);

      const done = store.saveOfficial();
      const req = http.expectOne('/api/v1/draws');
      expect(req.request.body).toEqual({
        title: null,
        kind: 'range',
        range: { start: 1, end: 500 },
        winnersCount: 2,
        showParticipants: true,
      });
      req.flush({ ...saved, kind: 'range' }, { status: 201, statusText: 'Created' });
      await done;
    });

    it('explains failures and keeps the previous result', async () => {
      store.listText.set('Ana\nBruno');
      store.quickDraw(sequence(0));

      const done = store.saveOfficial();
      http.expectOne('/api/v1/draws').flush({ title: 'Muitos sorteios. Aguarde.' }, { status: 429, statusText: 'x' });
      await done;

      expect(store.saveError()).toBe('Muitos sorteios. Aguarde.');
      expect(store.result()?.kind).toBe('quick');
    });

    it('a new quick draw replaces the official result', async () => {
      store.listText.set('Ana\nBruno');
      const done = store.saveOfficial();
      http.expectOne('/api/v1/draws').flush(saved, { status: 201, statusText: 'Created' });
      await done;

      store.quickDraw(sequence(0));

      expect(store.result()?.kind).toBe('quick');
    });
  });
});
