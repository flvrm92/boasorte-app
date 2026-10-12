import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

/** Controllable stand-in for window.matchMedia('(prefers-color-scheme: dark)'), which jsdom lacks. */
function stubSystemTheme(dark: boolean) {
  const listeners: ((e: { matches: boolean }) => void)[] = [];
  const query = {
    matches: dark,
    addEventListener: (_: string, listener: (e: { matches: boolean }) => void) => listeners.push(listener),
    removeEventListener: () => {},
  };
  vi.stubGlobal('matchMedia', () => query);
  return {
    change(nowDark: boolean) {
      query.matches = nowDark;
      listeners.forEach(l => l({ matches: nowDark }));
    },
  };
}

function createService() {
  const service = TestBed.inject(ThemeService);
  TestBed.tick();
  return service;
}

const appliedTheme = () => document.documentElement.dataset['theme'];

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  afterEach(() => vi.unstubAllGlobals());

  it('follows the system preference on the first visit', () => {
    stubSystemTheme(true);

    const service = createService();

    expect(service.mode()).toBe('system');
    expect(service.resolved()).toBe('dark');
    expect(appliedTheme()).toBe('dark');
  });

  it('reacts to system changes while following the system', () => {
    const system = stubSystemTheme(false);
    const service = createService();

    system.change(true);
    TestBed.tick();

    expect(service.resolved()).toBe('dark');
    expect(appliedTheme()).toBe('dark');
  });

  it('toggles to the opposite theme and remembers the choice', () => {
    stubSystemTheme(true);
    const service = createService();

    service.toggle();
    TestBed.tick();

    expect(service.mode()).toBe('light');
    expect(appliedTheme()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('a remembered choice wins over the system preference', () => {
    stubSystemTheme(false);
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const service = createService();

    expect(service.mode()).toBe('dark');
    expect(appliedTheme()).toBe('dark');
  });

  it('ignores garbage in storage', () => {
    stubSystemTheme(false);
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');

    expect(createService().mode()).toBe('system');
  });

  it('keeps working when storage is unavailable', () => {
    stubSystemTheme(false);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const service = createService();
    service.toggle();
    TestBed.tick();

    expect(appliedTheme()).toBe('dark');
    vi.restoreAllMocks();
  });
});
