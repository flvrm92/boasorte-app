import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LucideUpload } from '@lucide/angular';
import { Field, FieldControl } from '../../../shared/ui/field/field';
import { columnLabels, extractColumn, parseParticipantsFile } from '../domain/parse-file';
import { ListDrawStore } from '../list-draw.store';

/** Imports participants from .txt/.csv; asks which column to use when a CSV has several (spec 001, US3). */
@Component({
  selector: 'app-file-import',
  imports: [MatButtonModule, MatCheckboxModule, LucideUpload, Field, FieldControl],
  templateUrl: './file-import.html',
  styleUrl: './file-import.scss',
})
export class FileImport {
  private readonly store = inject(ListDrawStore);

  protected readonly error = signal<string | null>(null);
  protected readonly fileName = signal('');
  protected readonly table = signal<string[][] | null>(null);
  protected readonly hasHeader = signal(true);
  protected readonly column = signal(0);

  protected readonly labels = computed(() => {
    const table = this.table();
    return table ? columnLabels(table, this.hasHeader()) : [];
  });

  protected async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow choosing the same file again
    if (!file) return;

    this.error.set(null);
    this.table.set(null);
    const result = await parseParticipantsFile(file);
    if (!result.ok) {
      this.error.set(result.error);
      return;
    }

    if (columnLabels(result.table, false).length <= 1) {
      this.apply(extractColumn(result.table, 0, false));
      return;
    }

    this.fileName.set(file.name);
    this.column.set(0);
    this.hasHeader.set(true);
    this.table.set(result.table);
  }

  protected useColumn(): void {
    this.apply(extractColumn(this.table()!, this.column(), this.hasHeader()));
  }

  protected cancel(): void {
    this.table.set(null);
  }

  private apply(values: string[]): void {
    this.store.listText.set(values.join('\n'));
    this.store.mode.set('list');
    this.table.set(null);
  }
}
