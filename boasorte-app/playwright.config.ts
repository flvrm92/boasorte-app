import { defineConfig, devices } from '@playwright/test';

// E2E_BASE_URL set: test a running deployment (e.g. the local production rehearsal or https://boasorte.app).
// Otherwise: start (or reuse) `ng serve` and the API from the sibling boasorte-api repository.
const deployedUrl = process.env['E2E_BASE_URL'];
const baseURL = deployedUrl ?? 'http://localhost:4200';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: deployedUrl
    ? undefined
    : [
        {
          command: 'dotnet run --project ../../boasorte-api/src/BoaSorte.Api --launch-profile http',
          url: 'http://localhost:5236/api/health',
          reuseExistingServer: true,
          timeout: 180_000,
        },
        { command: 'npm start', url: baseURL, reuseExistingServer: true, timeout: 120_000 },
      ],
});
