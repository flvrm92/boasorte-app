import { Component, computed, Directive, inject, input } from '@angular/core';

let nextId = 0;

/**
 * Form field with the label above the control, an optional hint and an error (ADR 0001, item 3).
 * Mark the projected control with `appFieldControl` so it gets the id and ARIA wiring.
 */
@Component({
  selector: 'app-field',
  template: `
    <label class="label" [for]="controlId">{{ label() }}</label>
    <ng-content />
    @if (hint()) {
      <p class="hint" [id]="hintId">{{ hint() }}</p>
    }
    @if (error()) {
      <p class="error" [id]="errorId" role="alert">{{ error() }}</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }
    .label {
      font-weight: 700;
      font-size: 0.9rem;
    }
    .hint,
    .error {
      margin: 0;
      font-size: 0.875rem;
    }
    .hint {
      color: var(--color-ink-muted);
    }
    .error {
      color: var(--color-danger);
    }
  `,
})
export class Field {
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly error = input<string | null>();

  private readonly id = nextId++;
  readonly controlId = `field-${this.id}`;
  readonly hintId = `field-${this.id}-hint`;
  readonly errorId = `field-${this.id}-error`;

  readonly describedBy = computed(() => {
    const ids = [this.hint() ? this.hintId : null, this.error() ? this.errorId : null].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  });
}

/** Connects a native input/textarea/select to its enclosing `<app-field>`. */
@Directive({
  selector: '[appFieldControl]',
  host: {
    class: 'input',
    '[id]': 'field.controlId',
    '[attr.aria-describedby]': 'field.describedBy()',
    '[attr.aria-invalid]': 'field.error() ? "true" : null',
  },
})
export class FieldControl {
  protected readonly field = inject(Field);
}
