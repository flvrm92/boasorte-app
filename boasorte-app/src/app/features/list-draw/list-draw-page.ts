import { Component } from '@angular/core';
import { DrawResult } from './draw-result/draw-result';
import { DrawSettings } from './draw-settings/draw-settings';
import { ListDrawStore } from './list-draw.store';
import { ParticipantsInput } from './participants-input/participants-input';

/** Spec 001: draw names or numbers; quick draws in the browser, official draws saved with a shareable link. */
@Component({
  selector: 'app-list-draw-page',
  imports: [ParticipantsInput, DrawSettings, DrawResult],
  providers: [ListDrawStore],
  template: `
    <div class="page-head">
      <h1>Sorteio por lista</h1>
      <p>
        Cole os nomes, importe um arquivo ou escolha um intervalo de números. O sorteio rápido pode ser repetido; o
        sorteio salvo gera um link que comprova o resultado.
      </p>
    </div>

    <div class="grid">
      <section class="panel" aria-labelledby="participants-title">
        <h2 id="participants-title">Participantes</h2>
        <app-participants-input />
      </section>

      <div class="side">
        <section class="panel" aria-labelledby="settings-title">
          <h2 id="settings-title">Sorteio</h2>
          <app-draw-settings />
        </section>

        <section class="panel" aria-labelledby="result-title">
          <app-draw-result />
        </section>
      </div>
    </div>
  `,
  styles: `
    @use '../../../styles/breakpoints' as bp;

    .grid {
      display: grid;
      gap: var(--space-5);

      @media (min-width: bp.$lg) {
        grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
        align-items: start;
      }
    }

    .side {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }
  `,
})
export class ListDrawPage {}
