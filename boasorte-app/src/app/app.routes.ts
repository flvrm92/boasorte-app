import { Routes } from '@angular/router';

const legalPage = () => import('./features/legal/legal-page').then(m => m.LegalPage);

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home-page').then(m => m.HomePage),
  },
  {
    path: 'sorteio/lista',
    title: 'Sorteio por lista · BoaSorte',
    loadComponent: () => import('./features/list-draw/list-draw-page').then(m => m.ListDrawPage),
  },
  {
    path: 's/:publicId',
    title: 'Resultado do sorteio · BoaSorte',
    loadComponent: () => import('./features/shared-draw/shared-draw-page').then(m => m.SharedDrawPage),
  },
  { path: 'termos', title: 'Termos de uso · BoaSorte', data: { heading: 'Termos de uso' }, loadComponent: legalPage },
  { path: 'privacidade', title: 'Privacidade · BoaSorte', data: { heading: 'Política de privacidade' }, loadComponent: legalPage },
  // `ngDevMode` is replaced by `false` in production builds, so this route and its chunk are dropped.
  ...(typeof ngDevMode === 'undefined' || ngDevMode
    ? [
        {
          path: '_design',
          title: 'Design system · BoaSorte',
          loadComponent: () => import('./features/design-system/design-page').then(m => m.DesignPage),
        },
      ]
    : []),
  { path: '**', redirectTo: '' },
];
