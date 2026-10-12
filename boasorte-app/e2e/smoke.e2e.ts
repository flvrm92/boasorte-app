import { expect, test } from '@playwright/test';

test('home page loads and links to the list draw', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('BoaSorte');

  await page.getByRole('link', { name: 'Sortear uma lista' }).click();
  await expect(page).toHaveURL(/\/sorteio\/lista$/);
});
