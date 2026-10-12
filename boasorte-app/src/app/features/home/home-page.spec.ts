import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FAQ } from './faq';
import { HomePage } from './home-page';

describe('HomePage', () => {
  let root: HTMLElement;
  const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim();

  beforeEach(async () => {
    document.getElementById('faq-jsonld')?.remove();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(HomePage);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    root = fixture.nativeElement as HTMLElement;
  });

  describe('hero (US1)', () => {
    it('states what the product does', () => {
      expect(text(root.querySelector('h1'))).toBe('Sorteios justos, com resultado que não muda.');
    });

    it('starts a list draw in one click', () => {
      const cta = [...root.querySelectorAll('a')].find(a => text(a) === 'Sortear uma lista');

      expect(cta?.getAttribute('href')).toBe('/sorteio/lista');
    });

    it('announces comment draws as coming soon, without a dead link', () => {
      const soon = root.querySelector('[data-testid="comments-soon"]')!;

      expect(text(soon)).toContain('Sortear comentários');
      expect(text(soon)).toContain('Em breve');
      expect(soon.tagName).not.toBe('A');
      expect(soon.querySelector('a')).toBeNull();
    });

    it('shows what a saved result looks like', () => {
      const card = root.querySelector('[aria-label="Exemplo de resultado"]')!;

      expect([...card.querySelectorAll('li')].map(text)).toEqual(['1º Carla', '2º Bruno', '3º Eduarda']);
      expect(text(card)).toContain('boasorte.app/s/');
    });
  });

  it('explains how it works in three ordered steps (US2.1)', () => {
    const steps = root.querySelectorAll('#como-funciona ol > li h3');

    expect([...steps].map(text)).toEqual(['Adicione os participantes', 'Defina as regras', 'Sorteie e compartilhe']);
  });

  it('explains why the result can be trusted (US2.2)', () => {
    const reasons = root.querySelectorAll('#por-que-confiar li h3');

    expect([...reasons].map(text)).toEqual(['Aleatoriedade de verdade', 'Sorteio feito no servidor', 'Resultado que não muda']);
  });

  describe('FAQ (US2.3)', () => {
    it('lists every question as an expandable item', () => {
      const questions = [...root.querySelectorAll('#perguntas details summary')].map(text);

      expect(questions).toEqual(FAQ.map(item => item.question));
    });

    it('says comment draws work with your own Business/Creator account or Page (FR-205)', () => {
      const networks = FAQ.find(item => item.question === 'Quais redes sociais posso usar?')!;

      expect(networks.answer).toContain('Business ou Creator');
      expect(networks.answer).toContain('Páginas do Facebook');
    });

    it('links the privacy answer to the privacy policy', () => {
      expect(root.querySelector('#perguntas a[href="/privacidade"]')).not.toBeNull();
    });

    it('publishes the FAQ as structured data, once', () => {
      const scripts = document.querySelectorAll('#faq-jsonld');
      const data = JSON.parse(scripts[0].textContent!);

      expect(scripts).toHaveLength(1);
      expect(scripts[0].getAttribute('type')).toBe('application/ld+json');
      expect(data['@type']).toBe('FAQPage');
      expect(data.mainEntity).toHaveLength(FAQ.length);
      expect(data.mainEntity[0].acceptedAnswer.text).toBe(FAQ[0].answer);
    });
  });

  it('ends with a call to action', () => {
    const last = [...root.querySelectorAll('a')].at(-1);

    expect(text(last)).toBe('Sortear uma lista');
  });
});
