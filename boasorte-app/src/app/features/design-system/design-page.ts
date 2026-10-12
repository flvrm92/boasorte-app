import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { LucideShuffle, LucideUpload } from '@lucide/angular';
import { ThemeService } from '../../core/theme/theme.service';
import { Field, FieldControl } from '../../shared/ui/field/field';
import { LotteryBall } from '../../shared/ui/lottery-ball/lottery-ball';

@Component({
  selector: 'app-design-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Título do diálogo</h2>
    <mat-dialog-content>Texto explicando a consequência da ação.</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button mat-dialog-close cdkFocusInitial>Confirmar</button>
    </mat-dialog-actions>
  `,
})
class DesignDialog {}

/** Living reference of tokens and components in both themes (spec 004, FR-405). Dev builds only. */
@Component({
  selector: 'app-design-page',
  imports: [MatButtonModule, MatSlideToggleModule, MatTabsModule, LucideShuffle, LucideUpload, Field, FieldControl, LotteryBall],
  templateUrl: './design-page.html',
  styleUrl: './design-page.scss',
})
export class DesignPage {
  protected readonly theme = inject(ThemeService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly invalid = signal(true);

  protected readonly colors = [
    'bg',
    'surface',
    'surface-2',
    'ink',
    'ink-muted',
    'line',
    'primary',
    'primary-soft',
    'ball',
    'success',
    'danger',
  ];

  protected openDialog(): void {
    this.dialog.open(DesignDialog, { maxWidth: '440px' });
  }

  protected openSnackBar(): void {
    this.snackBar.open('Link copiado', undefined, { duration: 2500 });
  }
}
