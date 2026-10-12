import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { DrawResponse } from '../../core/api/draw.models';
import { SharedDrawPage } from './shared-draw-page';

const listDraw: DrawResponse = {
  publicId: 'aZ3k9QpL0xYt',
  title: 'Rifa do churrasco',
  kind: 'list',
  createdAt: '2026-10-12T18:22:05Z',
  expiresAt: '2027-10-12T18:22:05Z',
  settings: { removeDuplicates: true, winnersCount: 2, showParticipants: true, range: null },
  submittedCount: 5,
  eligibleCount: 3,
  winners: [
    { position: 1, value: 'Carla' },
    { position: 2, value: 'Ana' },
  ],
  participants: ['Ana', 'Bruno', 'Carla'],
};

describe('SharedDrawPage', () => {
  async function render() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    const fixture = TestBed.createComponent(SharedDrawPage);
    fixture.componentRef.setInput('publicId', 'aZ3k9QpL0xYt');
    fixture.autoDetectChanges();
    TestBed.tick(); // starts the request; the page only becomes stable once it is answered
    const http = TestBed.inject(HttpTestingController);
    const root = fixture.nativeElement as HTMLElement;
    const text = () => root.textContent?.replace(/\s+/g, ' ') ?? '';
    const respond = async (body: object, status = 200) => {
      http.expectOne('/api/v1/draws/aZ3k9QpL0xYt').flush(body, { status, statusText: 'x' });
      await fixture.whenStable();
    };
    return { fixture, root, http, text, respond };
  }

  it('shows a loading state first', async () => {
    const { text, respond } = await render();

    expect(text()).toContain('Carregando o resultado');
    await respond(listDraw);
  });

  it('shows the official result with its settings, winners and participants', async () => {
    const { root, text, respond } = await render();

    await respond(listDraw);

    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Rifa do churrasco');
    expect(text()).toContain('12 de outubro de 2026');
    expect(text()).toContain('3 participantes elegíveis de 5 entradas');
    expect(text()).toContain('Nomes repetidos removidos');
    expect([...root.querySelectorAll('.winners li')].map(li => li.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      '1º Carla',
      '2º Ana',
    ]);
    expect([...root.querySelectorAll('.participants li')].map(li => li.textContent?.trim())).toEqual(['Ana', 'Bruno', 'Carla']);
    expect(TestBed.inject(Title).getTitle()).toBe('Rifa do churrasco · BoaSorte');
  });

  it('says when the organizer hid the participants', async () => {
    const { root, text, respond } = await render();

    await respond({ ...listDraw, participants: null, settings: { ...listDraw.settings, showParticipants: false } });

    expect(root.querySelector('.participants')).toBeNull();
    expect(text()).toContain('O organizador escolheu não mostrar a lista de participantes.');
  });

  it('describes a numeric range draw', async () => {
    const { root, text, respond } = await render();

    await respond({
      ...listDraw,
      title: null,
      kind: 'range',
      participants: null,
      eligibleCount: 500,
      submittedCount: 500,
      settings: { removeDuplicates: false, winnersCount: 2, showParticipants: true, range: { start: 1, end: 500 } },
    });

    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Resultado do sorteio');
    expect(text()).toContain('Números de 1 a 500');
    expect(text()).not.toContain('O organizador escolheu');
  });

  it.each([
    [404, 'Não encontramos este sorteio.'],
    [410, 'Este sorteio expirou.'],
  ])('explains a %i', async (status, message) => {
    const { root, respond } = await render();

    await respond({ status }, status);

    expect(root.querySelector('h1')?.textContent?.trim()).toBe(message);
    expect(root.querySelector('a[href="/sorteio/lista"]')).not.toBeNull();
  });

  it('offers to try again when the server cannot be reached', async () => {
    const { root, http, fixture, text, respond } = await render();

    await respond({ status: 503 }, 503);
    expect(text()).toContain('Não foi possível carregar o resultado.');

    [...root.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Tentar de novo')!.click();
    TestBed.tick();

    http.expectOne('/api/v1/draws/aZ3k9QpL0xYt').flush(listDraw);
    await fixture.whenStable();
    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Rifa do churrasco');
  });
});
