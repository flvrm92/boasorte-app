import { TestBed } from '@angular/core/testing';
import { LotteryBall } from './lottery-ball';

describe('LotteryBall', () => {
  function render(position: number) {
    const fixture = TestBed.createComponent(LotteryBall);
    fixture.componentRef.setInput('position', position);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the ordinal position', () => {
    expect(render(1).textContent?.trim()).toBe('1º');
    expect(render(12).textContent?.trim()).toBe('12º');
  });

  it('staggers the entrance by position', () => {
    expect(render(3).style.getPropertyValue('--i')).toBe('2');
  });
});

describe('LotteryBall with many winners', () => {
  it('caps the stagger so the whole reveal stays under 3 seconds (spec 001, FR-007)', () => {
    const fixture = TestBed.createComponent(LotteryBall);
    fixture.componentRef.setInput('position', 500);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).style.getPropertyValue('--i')).toBe('10');
  });
});
