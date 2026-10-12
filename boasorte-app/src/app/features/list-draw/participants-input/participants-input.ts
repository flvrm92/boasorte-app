import { Component, computed, inject, WritableSignal } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { Field, FieldControl } from '../../../shared/ui/field/field';
import { FileImport } from '../file-import/file-import';
import { ListDrawStore } from '../list-draw.store';

const number = new Intl.NumberFormat('pt-BR');
const plural = (count: number, one: string, many: string) => `${number.format(count)} ${count === 1 ? one : many}`;

/** Participants as a typed/imported list or a numeric range (spec 001, US1–US4). */
@Component({
  selector: 'app-participants-input',
  imports: [MatTabsModule, Field, FieldControl, FileImport],
  templateUrl: './participants-input.html',
  styleUrl: './participants-input.scss',
})
export class ParticipantsInput {
  protected readonly store = inject(ListDrawStore);

  protected readonly tabIndex = computed(() => (this.store.mode() === 'list' ? 0 : 1));
  protected readonly entries = computed(() => plural(this.store.entryCount(), 'entrada', 'entradas'));
  protected readonly eligible = computed(() => plural(this.store.eligibleCount(), 'elegível', 'elegíveis'));
  protected readonly numbers = computed(() => plural(this.store.eligibleCount(), 'número elegível', 'números elegíveis'));

  protected selectTab(index: number): void {
    this.store.mode.set(index === 0 ? 'list' : 'range');
  }

  protected setText(event: Event): void {
    this.store.listText.set((event.target as HTMLTextAreaElement).value);
  }

  protected setNumber(target: WritableSignal<number | null>, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    target.set(value === '' || Number.isNaN(Number(value)) ? null : Math.trunc(Number(value)));
  }
}
