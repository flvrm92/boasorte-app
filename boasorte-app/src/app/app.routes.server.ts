import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Spec 003, FR-202: public content pages are prerendered at build time (indexable, fast first paint).
 * Everything else stays client-rendered and is served from index.csr.html by nginx.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'termos', renderMode: RenderMode.Prerender },
  { path: 'privacidade', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
