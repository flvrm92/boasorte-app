import { Component, input } from '@angular/core';

/** Placeholder until spec 003 publishes the terms of use and the privacy policy. */
@Component({
  selector: 'app-legal-page',
  template: `
    <h1>{{ heading() }}</h1>
    <p>Este documento será publicado junto com a página inicial do BoaSorte.</p>
  `,
  styles: `
    h1 {
      font-family: var(--font-display);
      font-weight: 600;
      letter-spacing: -0.03em;
    }
  `,
})
export class LegalPage {
  /** From the route `data`. */
  readonly heading = input.required<string>();
}
