import { expect, type Page, test } from '@playwright/test';

/** Spec 001 acceptance flows, against the real API. */

async function fillList(page: Page, names: string[]) {
  await page.getByLabel('Nomes ou números').fill(names.join('\n'));
}

test.describe('sorteio por lista', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('US1: quick draw from a typed list', async ({ page }) => {
    await page.goto('/sorteio/lista');
    await fillList(page, ['Ana', 'Bruno', 'ana', 'Carla']);
    await expect(page.getByTestId('counter')).toHaveText(/4 entradas\s*·\s*3 elegíveis/);

    await page.getByLabel('Número de ganhadores').fill('2');
    await page.getByRole('button', { name: 'Sortear', exact: true }).click();

    const winners = page.locator('app-draw-result li .name');
    await expect(winners).toHaveCount(2);
    for (const name of await winners.allInnerTexts()) expect(['Ana', 'Bruno', 'Carla']).toContain(name.trim());
    await expect(winners.first()).toBeInViewport();
    await expect(page.getByText('Sorteio rápido, não salvo')).toBeVisible();
  });

  test('US2: quick draw from a numeric range', async ({ page }) => {
    await page.goto('/sorteio/lista');
    await page.getByRole('tab', { name: 'Intervalo' }).click();
    await page.getByLabel('De', { exact: true }).fill('10');
    await page.getByLabel('Até', { exact: true }).fill('20');
    await page.getByRole('button', { name: 'Sortear', exact: true }).click();

    const value = Number((await page.locator('app-draw-result li .name').first().innerText()).trim());
    expect(value).toBeGreaterThanOrEqual(10);
    expect(value).toBeLessThanOrEqual(20);
  });

  test('US3 + US5: import a TXT, save the official draw and share an immutable link', async ({ page, context }) => {
    await page.goto('/sorteio/lista');
    await page.getByLabel('Arquivo de participantes').setInputFiles({
      name: 'inscritos.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Ana\nBruno\nCarla\nDaniel\n'),
    });
    await expect(page.getByLabel('Nomes ou números')).toHaveValue('Ana\nBruno\nCarla\nDaniel');

    await page.getByLabel('Título (opcional)').fill('Rifa e2e');
    await page.getByLabel('Número de ganhadores').fill('2');
    await page.getByRole('button', { name: 'Sortear e salvar' }).click();
    await page.getByRole('button', { name: 'Fazer sorteio oficial' }).click();

    const link = page.locator('.share-link');
    await expect(link).toBeVisible();
    const url = (await link.innerText()).trim();
    expect(url).toMatch(/\/s\/[0-9A-Za-z]{12}$/);
    const saved = await page.locator('app-draw-result li .name').allInnerTexts();

    for (const visit of [1, 2]) {
      const shared = await context.newPage();
      await shared.goto(new URL(url).pathname);
      await expect(shared.getByRole('heading', { level: 1 })).toHaveText('Rifa e2e');
      expect(await shared.locator('.winners li .name').allInnerTexts(), `visit ${visit}`).toEqual(saved);
      await expect(shared.getByText('4 participantes elegíveis de 4 entradas')).toBeVisible();
      await shared.close();
    }
  });

  test('US5.2: an unknown link explains itself', async ({ page }) => {
    await page.goto('/s/zzzzzzzzzzzz');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Não encontramos este sorteio.');
  });
});

test('pages load without console errors (including CSP violations)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', error => errors.push(error.message));

  for (const url of ['/', '/sorteio/lista', '/termos']) {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
  }

  expect(errors).toEqual([]);
});
