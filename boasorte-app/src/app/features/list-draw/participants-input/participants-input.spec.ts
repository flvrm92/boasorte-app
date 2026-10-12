import { renderWithStore } from '../testing';
import { ParticipantsInput } from './participants-input';

describe('ParticipantsInput', () => {
  it('counts entries and eligible participants as the list is typed', async () => {
    const { root, store, type } = await renderWithStore(ParticipantsInput);

    await type(root.querySelector('textarea')!, 'Ana\nana\n\nBruno');

    expect(store.listText()).toBe('Ana\nana\n\nBruno');
    expect(root.querySelector('[data-testid="counter"]')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '4 entradas · 2 elegíveis',
    );
  });

  it('shows list problems next to the field', async () => {
    const { root, type } = await renderWithStore(ParticipantsInput);

    await type(root.querySelector('textarea')!, `Ana\n${'x'.repeat(201)}`);

    expect(root.querySelector('[role="alert"]')?.textContent?.trim()).toBe('A linha 2 passa de 200 caracteres.');
  });

  it('switches to a numeric range', async () => {
    const { root, store, settle } = await renderWithStore(ParticipantsInput);

    [...root.querySelectorAll<HTMLElement>('[role="tab"]')].find(t => t.textContent?.trim() === 'Intervalo')!.click();
    await settle();

    expect(store.mode()).toBe('range');
  });

  it('validates the range', async () => {
    const { root, store, type, settle } = await renderWithStore(ParticipantsInput);
    store.mode.set('range');
    await settle();

    const [start, end] = root.querySelectorAll<HTMLInputElement>('input[type="number"]');
    await type(start, '10');
    await type(end, '1');

    expect(store.rangeStart()).toBe(10);
    expect(store.rangeEnd()).toBe(1);
    expect(root.querySelector('[role="alert"]')?.textContent?.trim()).toBe('O início deve ser menor ou igual ao fim.');
  });

  it('treats an empty number as missing', async () => {
    const { root, store, type, settle } = await renderWithStore(ParticipantsInput);
    store.mode.set('range');
    await settle();

    await type(root.querySelector<HTMLInputElement>('input[type="number"]')!, '');

    expect(store.rangeStart()).toBeNull();
  });
});
