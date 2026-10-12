import { Routes } from '@angular/router';

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
  { path: '**', redirectTo: '' },
];
