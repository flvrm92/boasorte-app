import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { DEFAULT_DESCRIPTION, SeoService, SITE_URL } from './seo.service';

@Component({ template: '' })
class Blank {}

const head = () => document.head;
const meta = (attr: 'name' | 'property', key: string) =>
  head().querySelector(`meta[${attr}="${key}"]`)?.getAttribute('content') ?? null;
const canonical = () => head().querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;

describe('SeoService', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    head().querySelectorAll('meta[name], meta[property], link[rel="canonical"]').forEach(el => el.remove());
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', title: 'BoaSorte · Sorteios justos', data: { description: 'Página inicial.' }, component: Blank },
          { path: 'termos', title: 'Termos de uso · BoaSorte', data: { description: 'Termos.' }, component: Blank },
          { path: 's/:id', title: 'Resultado · BoaSorte', data: { noindex: true }, component: Blank },
        ]),
      ],
    });
    TestBed.inject(SeoService).start();
    harness = await RouterTestingHarness.create();
  });

  it('describes each page for search engines and link previews', async () => {
    await harness.navigateByUrl('/termos');

    expect(meta('name', 'description')).toBe('Termos.');
    expect(canonical()).toBe(`${SITE_URL}/termos`);
    expect(meta('property', 'og:title')).toBe('Termos de uso · BoaSorte');
    expect(meta('property', 'og:description')).toBe('Termos.');
    expect(meta('property', 'og:url')).toBe(`${SITE_URL}/termos`);
    expect(meta('property', 'og:image')).toBe(`${SITE_URL}/og-image.png`);
    expect(meta('property', 'og:locale')).toBe('pt_BR');
    expect(meta('name', 'twitter:card')).toBe('summary_large_image');
    expect(meta('name', 'robots')).toBe('index, follow');
  });

  it('uses the site root as canonical for the home page', async () => {
    await harness.navigateByUrl('/');

    expect(canonical()).toBe(`${SITE_URL}/`);
    expect(meta('name', 'description')).toBe('Página inicial.');
  });

  it('keeps shared results out of search engines and falls back to the default description', async () => {
    await harness.navigateByUrl('/s/aZ3k9QpL0xYt');

    expect(meta('name', 'robots')).toBe('noindex, follow');
    expect(meta('name', 'description')).toBe(DEFAULT_DESCRIPTION);
  });

  it('updates tags instead of duplicating them', async () => {
    await harness.navigateByUrl('/');
    await harness.navigateByUrl('/termos');

    expect(head().querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(head().querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  });

  it('ignores query strings and fragments in the canonical url', async () => {
    await harness.navigateByUrl('/termos?utm_source=x#contato');

    expect(canonical()).toBe(`${SITE_URL}/termos`);
  });
});
