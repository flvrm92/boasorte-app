import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { HomePage } from './features/home/home-page';
import { ListDrawPage } from './features/list-draw/list-draw-page';
import { SharedDrawPage } from './features/shared-draw/shared-draw-page';

describe('app routes', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes, withComponentInputBinding())] });
    harness = await RouterTestingHarness.create();
  });

  it('renders the home page at the root', async () => {
    await expect(harness.navigateByUrl('/', HomePage)).resolves.toBeInstanceOf(HomePage);
  });

  it('renders the list draw page at /sorteio/lista', async () => {
    await expect(harness.navigateByUrl('/sorteio/lista', ListDrawPage)).resolves.toBeInstanceOf(ListDrawPage);
  });

  it('renders the shared draw page at /s/:publicId', async () => {
    await expect(harness.navigateByUrl('/s/aZ3k9QpL0xYt', SharedDrawPage)).resolves.toBeInstanceOf(SharedDrawPage);
  });

  it('redirects unknown urls to the home page', async () => {
    await harness.navigateByUrl('/nao-existe');

  });
});
