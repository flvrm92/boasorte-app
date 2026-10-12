import { expect, test } from '@playwright/test';

test('home page loads and links to the list draw', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sorteios justos, com resultado que não muda.');

  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Sortear lista' }).click();
  await expect(page).toHaveURL(/\/sorteio\/lista$/);
});
