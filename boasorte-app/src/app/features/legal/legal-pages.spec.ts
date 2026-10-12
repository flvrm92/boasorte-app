import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LEGAL_ENTITY } from './legal-entity';
import { PrivacyPage } from './privacy-page';
import { TermsPage } from './terms-page';

async function render(page: Type<unknown>) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(page);
  fixture.autoDetectChanges();
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  return {
    root,
    text: root.textContent?.replace(/\s+/g, ' ') ?? '',
    headings: [...root.querySelectorAll('h2')].map(h => h.textContent?.trim()),
  };
}

describe('PrivacyPage (FR-203, LGPD)', () => {
  it('identifies the controller and how to reach them', async () => {
    const { root, text } = await render(PrivacyPage);

    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Política de privacidade');
    expect(text).toContain(LEGAL_ENTITY.name);
    expect(text).toContain(LEGAL_ENTITY.cnpj);
    expect(root.querySelector(`a[href="mailto:${LEGAL_ENTITY.email}"]`)).not.toBeNull();
    expect(text).toContain('Vigente desde 12 de outubro de 2026');
  });

  it('covers every topic the plan requires', async () => {
    const { headings } = await render(PrivacyPage);

    expect(headings).toEqual([
      'Resumo',
      'Quem é o controlador',
      'Quais dados tratamos e para quê',
      'Cookies',
      'Com quem compartilhamos',
      'Por quanto tempo guardamos',
      'Seus direitos',
      'Como excluir seus dados',
      'Segurança',
      'Alterações desta política',
    ]);
  });

  it('describes what the system actually does', async () => {
    const { text } = await render(PrivacyPage);

    expect(text).toContain('não são enviados ao servidor'); // quick draw runs in the browser
    expect(text).toContain('12 meses'); // saved draw retention
    expect(text).toContain('não é gravado'); // IP only used for rate limiting
    expect(text).toContain('Não usamos cookies de rastreamento');
    expect(text).toContain('servidor localizado no Brasil');
  });
});

describe('TermsPage (FR-203)', () => {
  it('states the rules of the service', async () => {
    const { root, text, headings } = await render(TermsPage);

    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Termos de uso');
    expect(headings).toEqual([
      'O serviço',
      'Sorteio rápido e sorteio oficial',
      'Responsabilidades de quem organiza',
      'Links públicos',
      'Usos proibidos',
      'Disponibilidade e limites',
      'Limitação de responsabilidade',
      'Alterações destes termos',
      'Lei aplicável e foro',
      'Contato',
    ]);
    expect(text).toContain('Lei nº 5.768/1971');
    expect(root.querySelector('a[href="/privacidade"]')).not.toBeNull();
    expect(root.querySelector(`a[href="mailto:${LEGAL_ENTITY.email}"]`)).not.toBeNull();
  });
});
