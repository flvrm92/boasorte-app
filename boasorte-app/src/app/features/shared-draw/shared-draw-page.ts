import { Component, input } from '@angular/core';

/** Placeholder until spec 001, phase 5 (UI). */
@Component({
  selector: 'app-shared-draw-page',
  template: `<h1>Resultado do sorteio {{ publicId() }}</h1>`,
})
export class SharedDrawPage {
  readonly publicId = input.required<string>();
}
