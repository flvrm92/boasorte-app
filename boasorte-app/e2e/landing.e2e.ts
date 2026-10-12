import { expect, test } from '@playwright/test';

/** Spec 003: landing, terms and privacy — prerendered, indexable and accessible. */

const pages = [
  { url: '/', h1: 'Sorteios justos, com resultado que não muda.', canonical: 'https://boasorte.app/' },
  { url: '/termos', h1: 'Termos de uso', canonical: 'https://boasorte.app/termos' },
  { url: '/privacidade', h1: 'Política de privacidade', canonical: 'https://boasorte.app/privacidade' },
];

for (const page of pages) {
  test(`FR-202: ${page.url} is served with its content and SEO tags, before any JavaScript runs`, async ({ request }) => {
    const response = await request.get(page.url);
    const html = await response.text();

    expect(response.status()).toBe(200);
    expect(html).toContain(page.h1);
    expect(html).toMatch(/<meta name="description" content="[^"]{40,}"/);
    expect(html).toContain(`<link rel="canonical" href="${page.canonical}">`);
    expect(html).toContain('<meta property="og:image" content="https://boasorte.app/og-image.png">');
    expect(html).toContain('<meta name="robots" content="index, follow">');
  });
}

test('the landing structured data lists the FAQ', async ({ request }) => {
  const html = await (await request.get('/')).text();
  const json = html.match(/<script id="faq-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];

  expect(JSON.parse(json!)['@type']).toBe('FAQPage');
});

test('US1: the main call to action starts a list draw', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Sortear uma lista' }).first().click();

  await expect(page).toHaveURL(/\/sorteio\/lista$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sorteio por lista');
});

test('US1: comment draws are announced as coming soon, not linked', async ({ page }) => {
  await page.goto('/');

  const soon = page.getByTestId('comments-soon');
  await expect(soon).toContainText('Em breve');
  await expect(page.getByRole('link', { name: /Sortear comentários/ })).toHaveCount(0);
});

test('US2.3: FAQ answers expand and link to the privacy policy', async ({ page }) => {
  await page.goto('/');
  await page.getByText('O que vocês fazem com os nomes que eu coloco?').click();
  await page.getByRole('link', { name: 'Ler a política de privacidade' }).click();

  await expect(page).toHaveURL(/\/privacidade$/);
});

test('footer links reach the terms and the privacy policy', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Termos de uso' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Termos de uso');

  await page.getByRole('contentinfo').getByRole('link', { name: 'Privacidade' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Política de privacidade');
});

test('shared results are kept out of search engines', async ({ page }) => {
  const response = await page.goto('/s/zzzzzzzzzzzz');

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  // In production nginx also sends the header, which works even for crawlers that do not run JavaScript.
  if (process.env['E2E_BASE_URL']) {
    expect(response?.headers()['x-robots-tag']).toBe('noindex, follow');
  }
});

test('robots.txt and sitemap.xml are published', async ({ request }) => {
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://boasorte.app/sitemap.xml');
  expect(await (await request.get('/sitemap.xml')).text()).toContain('<loc>https://boasorte.app/privacidade</loc>');
  expect((await request.get('/og-image.png')).headers()['content-type']).toBe('image/png');
});
