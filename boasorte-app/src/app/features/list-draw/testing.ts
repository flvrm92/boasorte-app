import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { ListDrawStore } from './list-draw.store';

/** Renders a list-draw component with a real store and a fake HTTP backend. */
export async function renderWithStore<T>(component: Type<T>) {
  TestBed.configureTestingModule({
    providers: [
      ListDrawStore,
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      // jsdom fires no animation events; Material waits for them before showing tabs or closing dialogs.
      { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
    ],
  });
  const fixture: ComponentFixture<T> = TestBed.createComponent(component);
  fixture.autoDetectChanges();
  await fixture.whenStable();

  const root = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    root,
    store: TestBed.inject(ListDrawStore),
    http: TestBed.inject(HttpTestingController),
    /** Finds a button by its visible text or aria-label. */
    button: (name: string) =>
      [...document.querySelectorAll<HTMLButtonElement>('button')].find(
        b => (b.getAttribute('aria-label') ?? b.textContent?.trim()) === name,
      ),
    type: async (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
      element.value = value;
      element.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    },
    settle: () => fixture.whenStable(),
  };
}
