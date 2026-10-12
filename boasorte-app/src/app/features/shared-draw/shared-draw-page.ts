import { Component, computed, effect, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { DrawApi } from '../../core/api/draw-api';
import { DrawApiError } from '../../core/api/draw.models';
import { LotteryBall } from '../../shared/ui/lottery-ball/lottery-ball';

const number = new Intl.NumberFormat('pt-BR');
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' });

/** Public, immutable result of an official draw (spec 001, US5.2–5.4). */
@Component({
  selector: 'app-shared-draw-page',
  imports: [MatButtonModule, RouterLink, LotteryBall],
  templateUrl: './shared-draw-page.html',
  styleUrl: './shared-draw-page.scss',
})
export class SharedDrawPage {
  /** From the route parameter. */
  readonly publicId = input.required<string>();

  private readonly api = inject(DrawApi);
  private readonly title = inject(Title);

  protected readonly draw = rxResource({
    params: () => this.publicId(),
    stream: ({ params }) => this.api.get(params),
  });

  /** rxResource may wrap non-Error values; unwrap to the DrawApiError emitted by DrawApi. */
  protected readonly failure = computed(() => {
    const error = this.draw.error() as (Error & { cause?: unknown }) | undefined;
    if (!error) return null;
    return ((error.cause ?? error) as DrawApiError).kind;
  });

  protected readonly view = computed(() => {
    const draw = this.draw.hasValue() ? this.draw.value() : null;
    if (!draw) return null;

    const range = draw.settings.range;
    return {
      draw,
      heading: draw.title ?? 'Resultado do sorteio',
      createdAt: dateTime.format(new Date(draw.createdAt)),
      expiresAt: date.format(new Date(draw.expiresAt)),
      pool: range
        ? `Números de ${number.format(range.start)} a ${number.format(range.end)}`
        : `${number.format(draw.eligibleCount)} participantes elegíveis de ${number.format(draw.submittedCount)} entradas`,
      winnersLabel: draw.settings.winnersCount === 1 ? '1 ganhador' : `${number.format(draw.settings.winnersCount)} ganhadores`,
      hiddenParticipants: draw.kind === 'list' && draw.participants === null,
    };
  });

  constructor() {
    effect(() => {
      const heading = this.view()?.heading;
      if (heading) this.title.setTitle(`${heading} · BoaSorte`);
    });
  }
}
