// Renders public/og-image.png (1200×630) from the brand tokens and fonts. Run: node scripts/og-image.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Inlined as data URLs: a page created with setContent cannot load file:// fonts.
const font = path => `data:font/woff2;base64,${readFileSync(`node_modules/${path}`).toString('base64')}`;
const ball = (n, name) => `
  <li><span class="ball"><span>${n}º</span></span>${name}</li>`;

const html = `<!doctype html><html><head><style>
  @font-face { font-family: Display; src: url(${font('@fontsource-variable/unbounded/files/unbounded-latin-wght-normal.woff2')}); font-weight: 200 900; }
  @font-face { font-family: Body; src: url(${font('@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2')}); font-weight: 200 800; }
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; background: #f4f6fb; color: #12153a; font-family: Body; display: grid;
         grid-template-columns: 1.3fr 1fr; align-items: center; gap: 56px; padding: 72px 80px; }
  .brand { display: flex; align-items: center; gap: 14px; font-family: Display; font-weight: 700; font-size: 34px; letter-spacing: -0.02em; margin-bottom: 40px; }
  .brand svg { width: 52px; height: 52px; }
  h1 { font-family: Display; font-weight: 600; font-size: 62px; line-height: 1.04; letter-spacing: -0.04em; }
  p { margin-top: 24px; font-size: 26px; color: #545a83; }
  .card { background: #fff; border: 1px solid #d5d9ec; border-radius: 28px; padding: 36px; transform: rotate(-2deg);
          box-shadow: 0 2px 4px rgb(18 21 58 / 6%), 0 24px 48px rgb(18 21 58 / 10%); }
  .eyebrow { font-family: monospace; font-size: 16px; letter-spacing: .08em; color: #2338c9; text-transform: uppercase; }
  .title { font-family: Display; font-weight: 600; font-size: 28px; margin: 6px 0 24px; }
  ol { list-style: none; padding: 0; display: grid; gap: 18px; font-size: 28px; font-weight: 700; }
  li { display: flex; align-items: center; gap: 20px; }
  .ball { width: 68px; height: 68px; border-radius: 50%; display: grid; place-items: center;
          background: radial-gradient(circle at 30% 26%, rgb(255 255 255 / 55%) 0 9%, transparent 10%), radial-gradient(circle at 38% 34%, #ffc531 0 52%, #e59a00 100%);
          box-shadow: inset -5px -7px 12px rgb(0 0 0 / 14%), 0 8px 16px rgb(0 0 0 / 18%); }
  .ball span { width: 58%; height: 58%; border-radius: 50%; background: #fff; display: grid; place-items: center; font-family: Display; font-size: 18px; }
</style></head><body>
  <div>
    <div class="brand">
      <svg viewBox="0 0 32 32"><defs><radialGradient id="g" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#ffc531"/><stop offset="1" stop-color="#e59a00"/></radialGradient></defs>
        <circle cx="16" cy="16" r="15" fill="url(#g)"/><circle cx="16" cy="16" r="8.5" fill="#fff"/>
        <text x="16" y="20" text-anchor="middle" font-family="Display" font-weight="800" font-size="11" fill="#12153a">b</text></svg>
      boa sorte
    </div>
    <h1>Sorteios justos, com resultado que não muda.</h1>
    <p>Listas, números e comentários. Grátis e sem cadastro.</p>
  </div>
  <div class="card">
    <div class="eyebrow">Sorteio oficial</div>
    <div class="title">Rifa do churrasco</div>
    <ol>${ball(1, 'Carla')}${ball(2, 'Bruno')}${ball(3, 'Eduarda')}</ol>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og-image.png' });
await browser.close();
console.log('public/og-image.png');
