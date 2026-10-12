import { Component, computed, input } from '@angular/core';

/** The BoaSorte signature (spec 004): a winner's position drawn as a lottery ball. */
@Component({
  selector: 'app-lottery-ball',
  host: { '[style.--i]': 'stagger()' },
  template: `<span>{{ position() }}º</span>`,
  styles: `
    :host {
      flex: none;
      width: 56px;
      aspect-ratio: 1;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at 30% 26%, rgb(255 255 255 / 55%) 0 9%, transparent 10%),
        radial-gradient(circle at 38% 34%, var(--color-ball) 0 52%, var(--color-ball-shade) 100%);
      box-shadow:
        inset -4px -6px 10px rgb(0 0 0 / 14%),
        0 6px 14px rgb(0 0 0 / 18%);
      animation: ball-drop 650ms var(--ease-bounce) both;
      animation-delay: calc(var(--i, 0) * 140ms);
    }
    span {
      width: 58%;
      aspect-ratio: 1;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: #fff;
      color: var(--color-on-ball);
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.95rem;
    }
    @keyframes ball-drop {
      from {
        opacity: 0;
        transform: translateY(-48px) rotate(-200deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host {
        animation: none;
      }
    }
  `,
})
export class LotteryBall {
  /** 1 = first place. */
  readonly position = input.required<number>();

  /** Capped so even 1,000 winners are revealed within ~2 s (spec 001, FR-007). */
  protected readonly stagger = computed(() => String(Math.min(this.position() - 1, 10)));
}
