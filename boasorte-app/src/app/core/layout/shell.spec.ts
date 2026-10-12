import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Shell } from './shell';

@Component({
  imports: [Shell],
  template: `<app-shell><p id="page">conteúdo</p></app-shell>`,
})
class Host {}

describe('Shell', () => {
  let root: HTMLElement;

  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Host);
    fixture.autoDetectChanges();
    root = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => vi.unstubAllGlobals());

  const link = (name: string) =>
    [...root.querySelectorAll('a')].find(a => (a.getAttribute('aria-label') ?? a.textContent?.trim()) === name);

  it('links the brand to the home page', () => {
    expect(link('BoaSorte, página inicial')?.getAttribute('href')).toBe('/');
  });

  it('offers the list draw in the main navigation', () => {
    const nav = root.querySelector('nav[aria-label="Principal"]');

    expect(nav?.querySelector('a[href="/sorteio/lista"]')?.textContent?.trim()).toBe('Sortear lista');
  });

  it('switches the theme from the header', () => {
    const toggle = root.querySelector<HTMLButtonElement>('header button')!;
    expect(toggle.getAttribute('aria-label')).toBe('Usar tema escuro');

    toggle.click();
    TestBed.tick();

    expect(toggle.getAttribute('aria-label')).toBe('Usar tema claro');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('renders the page inside the main landmark', () => {
    expect(root.querySelector('main #page')).not.toBeNull();
  });

  it('links to the terms and the privacy policy in the footer', () => {
    const footer = root.querySelector('footer')!;

    expect(footer.querySelector('a[href="/termos"]')?.textContent?.trim()).toBe('Termos de uso');
    expect(footer.querySelector('a[href="/privacidade"]')?.textContent?.trim()).toBe('Privacidade');
  });
});
