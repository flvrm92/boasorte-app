import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  it('renders the routed page inside the shell', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
    await TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([])] }).compileComponents();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-shell main router-outlet')).not.toBeNull();
    vi.unstubAllGlobals();
  });
});
