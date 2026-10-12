import { Routes } from '@angular/router';
import { SeoRouteData } from './core/seo/seo.service';

const seo = (data: SeoRouteData) => data;

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'BoaSorte · Sorteios justos de listas e comentários',
    data: seo({
      description:
        'Sorteie nomes, números e comentários com aleatoriedade criptográfica e compartilhe um link de resultado que não muda. Grátis e sem cadastro.',
    }),
    loadComponent: () => import('./features/home/home-page').then(m => m.HomePage),
  },
  {
    path: 'sorteio/lista',
    title: 'Sorteio por lista · BoaSorte',
    data: seo({
      description:
        'Cole nomes, importe um arquivo .txt ou .csv ou escolha um intervalo de números e sorteie. Salve para ter um link que comprova o resultado.',
    }),
    loadComponent: () => import('./features/list-draw/list-draw-page').then(m => m.ListDrawPage),
  },
  {
    path: 's/:publicId',
    title: 'Resultado do sorteio · BoaSorte',
    // Shared results contain participants' names: keep them out of search engines.
    data: seo({ noindex: true }),
    loadComponent: () => import('./features/shared-draw/shared-draw-page').then(m => m.SharedDrawPage),
  },
  {
    path: 'termos',
    title: 'Termos de uso · BoaSorte',
    data: seo({ description: 'Termos de uso do BoaSorte: regras, responsabilidades e limites do serviço.' }),
    loadComponent: () => import('./features/legal/terms-page').then(m => m.TermsPage),
  },
  {
    path: 'privacidade',
    title: 'Política de privacidade · BoaSorte',
    data: seo({
      description: 'Quais dados o BoaSorte trata, por quanto tempo, com quais finalidades e como exercer seus direitos (LGPD).',
    }),
    loadComponent: () => import('./features/legal/privacy-page').then(m => m.PrivacyPage),
  },
  // `ngDevMode` is replaced by `false` in production builds, so this route and its chunk are dropped.
  ...(typeof ngDevMode === 'undefined' || ngDevMode
    ? [
        {
          path: '_design',
          title: 'Design system · BoaSorte',
          data: seo({ noindex: true }),
          loadComponent: () => import('./features/design-system/design-page').then(m => m.DesignPage),
        },
      ]
    : []),
  { path: '**', redirectTo: '' },
];
