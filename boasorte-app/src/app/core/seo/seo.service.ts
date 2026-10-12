import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export const SITE_URL = 'https://boasorte.app';
export const DEFAULT_DESCRIPTION =
  'Sorteie nomes, números e comentários de forma justa e compartilhe o resultado com um link que não muda.';

/**
 * Route `data` read by {@link SeoService}. The page title comes from the route's `title`.
 * `noindex` keeps user content (e.g. shared results with participant names) out of search engines.
 */
export interface SeoRouteData {
  description?: string;
  noindex?: boolean;
}

/** Description, canonical URL, Open Graph and robots tags per route (spec 003, FR-202). Runs during prerender too. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  start(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.apply(this.deepest(this.router.routerState.snapshot.root)));
  }

  private apply(route: ActivatedRouteSnapshot): void {
    const data = route.data as SeoRouteData;
    const path = this.router.url.split(/[?#]/)[0];
    const url = `${SITE_URL}${path === '/' ? '/' : path}`;
    const title = route.title ?? 'BoaSorte';
    const description = data.description ?? DEFAULT_DESCRIPTION;

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: data.noindex ? 'noindex, follow' : 'index, follow' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'BoaSorte' });
    this.meta.updateTag({ property: 'og:locale', content: 'pt_BR' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: `${SITE_URL}/og-image.png` });
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.setCanonical(url);
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private deepest(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    return route.firstChild ? this.deepest(route.firstChild) : route;
  }
}
