import { isDevMode } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { DesignPage } from './features/design-system/design-page';
import { HomePage } from './features/home/home-page';
import { PrivacyPage } from './features/legal/privacy-page';
import { TermsPage } from './features/legal/terms-page';
import { ListDrawPage } from './features/list-draw/list-draw-page';
import { SharedDrawPage } from './features/shared-draw/shared-draw-page';

describe('app routes', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
    TestBed.configureTestingModule({ providers: [provideRouter(routes, withComponentInputBinding())] });
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders the home page at the root', async () => {
    await expect(harness.navigateByUrl('/', HomePage)).resolves.toBeInstanceOf(HomePage);
  });

  it('renders the list draw page at /sorteio/lista', async () => {
    await expect(harness.navigateByUrl('/sorteio/lista', ListDrawPage)).resolves.toBeInstanceOf(ListDrawPage);
  });

  it('renders the shared draw page at /s/:publicId', async () => {
    await expect(harness.navigateByUrl('/s/aZ3k9QpL0xYt', SharedDrawPage)).resolves.toBeInstanceOf(SharedDrawPage);
  });

  it('renders the terms of use at /termos', async () => {
    await expect(harness.navigateByUrl('/termos', TermsPage)).resolves.toBeInstanceOf(TermsPage);
  });

  it('renders the privacy policy at /privacidade', async () => {
    await expect(harness.navigateByUrl('/privacidade', PrivacyPage)).resolves.toBeInstanceOf(PrivacyPage);
  });

  it('exposes the design system page only in dev mode', async () => {
    expect(isDevMode()).toBe(true);
    await expect(harness.navigateByUrl('/_design', DesignPage)).resolves.toBeInstanceOf(DesignPage);
  });

  it('redirects unknown urls to the home page', async () => {
    await harness.navigateByUrl('/nao-existe');

    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(HomePage);
  });
});
