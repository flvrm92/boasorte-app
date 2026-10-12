import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = Exclude<ThemeMode, 'system'>;

/** Also read by public/theme-init.js, which applies the theme before first paint. */
export const THEME_STORAGE_KEY = 'boasorte-theme';

/**
 * Light/dark theme (spec 004, FR-402): follows the OS until the user picks one; the choice is remembered.
 * During prerendering (no window) it stays inert; theme-init.js sets the real theme when the page loads.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly media = this.browser ? this.document.defaultView!.matchMedia('(prefers-color-scheme: dark)') : null;
  private readonly systemDark = signal(this.media?.matches ?? false);

  readonly mode = signal<ThemeMode>(this.browser ? readStoredMode() : 'system');

  readonly resolved = computed<ResolvedTheme>(() => {
    const mode = this.mode();
    if (mode !== 'system') return mode;
    return this.systemDark() ? 'dark' : 'light';
  });

  constructor() {
    if (!this.browser) return;

    this.media!.addEventListener('change', event => this.systemDark.set(event.matches));

    effect(() => {
      this.document.documentElement.dataset['theme'] = this.resolved();
      storeMode(this.mode());
    });
  }

  toggle(): void {
    this.mode.set(this.resolved() === 'dark' ? 'light' : 'dark');
  }
}

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

function storeMode(mode: ThemeMode): void {
  try {
    if (mode === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Storage blocked (private mode, policies): keep the choice for this session only.
  }
}
