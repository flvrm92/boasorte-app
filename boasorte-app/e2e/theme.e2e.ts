import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const html = (page: import('@playwright/test').Page) => page.locator('html');

test.describe('theme (spec 004, US1)', () => {
  test('follows the system preference on the first visit', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  });

  test('remembers the manual choice after a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    await page.getByRole('button', { name: 'Usar tema escuro' }).click();
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: 'Usar tema claro' })).toBeVisible();
  });

  test('applies the remembered theme before the first paint (no flash)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      localStorage.setItem('boasorte-theme', 'dark');
      // Record every value <html data-theme> takes and whether the body had been parsed yet.
      const seen: { theme: string | null; bodyParsed: boolean }[] = [];
      (window as unknown as { __themes: typeof seen }).__themes = seen;
      // Observe the whole document: <html> does not exist yet when init scripts run.
      new MutationObserver(records =>
        records.forEach(r =>
          seen.push({ theme: (r.target as Element).getAttribute('data-theme'), bodyParsed: !!document.body }),
        ),
      ).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-theme'] });
    });

    await page.goto('/');
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');

    const seen = await page.evaluate(
      () => (window as unknown as { __themes: { theme: string; bodyParsed: boolean }[] }).__themes,
    );
    // Set from <head>, before any content exists, and never anything else.
    expect(seen[0]).toEqual({ theme: 'dark', bodyParsed: false });
    expect(seen.map(s => s.theme)).not.toContain('light');
  });
});

for (const theme of ['light', 'dark'] as const) {
  test(`has no serious accessibility violations (${theme})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); // measure the resting state, not mid-animation
    await page.addInitScript(t => localStorage.setItem('boasorte-theme', t), theme);

    for (const url of ['/', '/sorteio/lista', '/termos', '/privacidade', ...(process.env['E2E_BASE_URL'] ? [] : ['/_design'])]) {
      await page.goto(url);
      await expect(html(page)).toHaveAttribute('data-theme', theme);
      await page.evaluate(() => document.fonts.ready);

      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const serious = violations
        .filter(v => v.impact === 'serious' || v.impact === 'critical')
        .map(v => `${url}: ${v.id} → ${v.nodes.map(n => n.target.join(' ')).join(', ')}`);

      expect(serious).toEqual([]);
    }
  });
}

test('has no horizontal scroll at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });

  for (const url of ['/', '/privacidade', ...(process.env['E2E_BASE_URL'] ? [] : ['/_design'])]) {
    await page.goto(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, url).toBeLessThanOrEqual(0);
  }
});
