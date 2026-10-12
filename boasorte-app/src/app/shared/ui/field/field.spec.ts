import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Field, FieldControl } from './field';

@Component({
  imports: [Field, FieldControl],
  template: `
    <app-field label="Título" [hint]="hint()" [error]="error()">
      <input appFieldControl />
    </app-field>
  `,
})
class Host {
  readonly hint = signal<string | undefined>('Aparece no link compartilhado');
  readonly error = signal<string | null>(null);
}

function render() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const input = root.querySelector('input')!;
  const describedBy = () => (input.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
  const textOf = (id: string) => root.querySelector(`#${id}`)?.textContent?.trim();
  return { fixture, host: fixture.componentInstance, root, input, describedBy, textOf };
}

describe('Field', () => {
  it('labels the projected control', () => {
    const { root, input } = render();

    const label = root.querySelector<HTMLLabelElement>(`label[for="${input.id}"]`);

    expect(input.id).not.toBe('');
    expect(label?.textContent?.trim()).toBe('Título');
  });

  it('describes the control with the hint', () => {
    const { describedBy, textOf } = render();

    expect(describedBy().map(textOf)).toEqual(['Aparece no link compartilhado']);
  });

  it('announces errors and marks the control invalid', () => {
    const { fixture, host, input, describedBy, textOf, root } = render();

    host.error.set('O título deve ter no máximo 120 caracteres.');
    fixture.detectChanges();

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(describedBy().map(textOf)).toContain('O título deve ter no máximo 120 caracteres.');
    expect(root.querySelector('[role="alert"]')?.textContent?.trim()).toBe('O título deve ter no máximo 120 caracteres.');
  });

  it('has no description when there is neither hint nor error', () => {
    const { fixture, host, input } = render();

    host.hint.set(undefined);
    fixture.detectChanges();

    expect(input.hasAttribute('aria-describedby')).toBe(false);
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });

  it('gives each field its own ids', () => {
    const first = render().input.id;
    const second = render().input.id;

    expect(first).not.toBe(second);
  });
});
