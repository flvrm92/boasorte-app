import { afterRenderEffect, Component, computed, ElementRef, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { LucideCopy } from '@lucide/angular';
import { LotteryBall } from '../../../shared/ui/lottery-ball/lottery-ball';
import { ListDrawStore } from '../list-draw.store';

/** Winners as lottery balls; the official result comes with its shareable link (spec 001, FR-007/008/009). */
@Component({
  selector: 'app-draw-result',
  imports: [MatButtonModule, RouterLink, LucideCopy, LotteryBall],
  templateUrl: './draw-result.html',
  styleUrl: './draw-result.scss',
})
export class DrawResult {
  protected readonly store = inject(ListDrawStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly official = computed(() => {
    const result = this.store.result();
    return result?.kind === 'official' ? result.draw : null;
  });

  protected readonly sharePath = computed(() => {
    const draw = this.official();
    return draw ? `/s/${draw.publicId}` : null;
  });

  protected readonly shareUrl = computed(() => (this.sharePath() ? `${location.origin}${this.sharePath()}` : null));

  constructor() {
    // On small screens the result sits below the form: bring each new result into view.
    let previous = this.store.result();
    afterRenderEffect(() => {
      const result = this.store.result();
      if (!result || result === previous) return;
      previous = result;
      const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true;
      this.host.nativeElement.scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    });
  }

  protected async copyLink(): Promise<void> {
    await navigator.clipboard.writeText(this.shareUrl()!);
    this.snackBar.open('Link copiado', undefined, { duration: 2500 });
  }
}
