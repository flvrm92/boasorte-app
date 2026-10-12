import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LucideShuffle } from '@lucide/angular';
import { Field, FieldControl } from '../../../shared/ui/field/field';
import { ListDrawStore } from '../list-draw.store';
import { OfficialDrawDialog } from '../official-draw-dialog/official-draw-dialog';

/** Draw options and the two ways to draw (spec 001, FR-004/005/008/009/012). */
@Component({
  selector: 'app-draw-settings',
  imports: [MatButtonModule, MatSlideToggleModule, MatProgressSpinnerModule, LucideShuffle, Field, FieldControl],
  templateUrl: './draw-settings.html',
  styleUrl: './draw-settings.scss',
})
export class DrawSettings {
  protected readonly store = inject(ListDrawStore);
  private readonly dialog = inject(MatDialog);

  /** "No participants yet" is guidance, shown below the buttons, not an error on the field. */
  protected readonly empty = computed(() => this.store.eligibleCount() === 0 && this.store.mode() === 'list');
  protected readonly winnersError = computed(() => (this.empty() ? null : this.store.winnersError()));

  protected setTitle(event: Event): void {
    this.store.title.set((event.target as HTMLInputElement).value);
  }

  protected setWinners(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.store.winnersCount.set(value === '' ? null : Math.trunc(Number(value)));
  }

  protected confirmOfficial(): void {
    this.dialog
      .open(OfficialDrawDialog, { maxWidth: '440px' })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) void this.store.saveOfficial();
      });
  }
}
