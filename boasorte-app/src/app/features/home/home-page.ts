import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Placeholder until spec 003 (landing page). */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  template: `
    <h1>BoaSorte</h1>
    <a routerLink="/sorteio/lista">Sortear uma lista</a>
  `,
})
export class HomePage {}
