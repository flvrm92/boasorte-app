import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { ListDrawPage } from './list-draw-page';

describe('ListDrawPage', () => {
  it('goes from a typed list to winners shown as lottery balls', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    const fixture = TestBed.createComponent(ListDrawPage);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Sorteio por lista');

    const textarea = root.querySelector('textarea')!;
    textarea.value = 'Ana\nBruno\nCarla';
    textarea.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    [...root.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Sortear')!.click();
    await fixture.whenStable();

    const winners = root.querySelectorAll('app-draw-result li');
    expect(winners).toHaveLength(1);
    expect(['Ana', 'Bruno', 'Carla']).toContain(winners[0].querySelector('.name')?.textContent?.trim());
  });
});
