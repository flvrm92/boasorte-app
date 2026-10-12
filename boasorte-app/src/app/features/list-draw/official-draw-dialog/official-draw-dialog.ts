import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

/** Spec 001, FR-012: the official draw is a new draw made by the server; say so before it happens. */
@Component({
  selector: 'app-official-draw-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Fazer o sorteio oficial?</h2>
    <mat-dialog-content>
      <p>
        O sorteio oficial é feito de novo no servidor e gera um link que não muda. O resultado pode ser diferente do
        sorteio rápido que você viu aqui.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Cancelar</button>
      <button mat-flat-button type="button" [mat-dialog-close]="true" cdkFocusInitial>Fazer sorteio oficial</button>
    </mat-dialog-actions>
  `,
})
export class OfficialDrawDialog {}
