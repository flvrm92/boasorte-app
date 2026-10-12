import { DrawResponse } from '../../../core/api/draw.models';
import { renderWithStore } from '../testing';
import { DrawSettings } from './draw-settings';

describe('DrawSettings', () => {
  it('disables drawing until there is something to draw', async () => {
    const { store, button, settle } = await renderWithStore(DrawSettings);

    expect(button('Sortear')!.disabled).toBe(true);
    expect(button('Sortear e salvar')!.disabled).toBe(true);

    store.listText.set('Ana\nBruno');
    await settle();

    expect(button('Sortear')!.disabled).toBe(false);
  });

  it('shows why the winners count is not possible', async () => {
    const { root, store, type } = await renderWithStore(DrawSettings);
    store.listText.set('Ana\nBruno');

    await type(root.querySelector<HTMLInputElement>('input[type="number"]')!, '3');

    expect(store.winnersCount()).toBe(3);
    expect(root.querySelector('[role="alert"]')?.textContent?.trim()).toBe('Há apenas 2 participantes elegíveis.');
  });

  it('makes a quick draw', async () => {
    const { store, button, settle } = await renderWithStore(DrawSettings);
    store.listText.set('Ana\nBruno');
    await settle();

    button('Sortear')!.click();

    expect(store.result()?.kind).toBe('quick');
  });

  it('binds the options', async () => {
    const { root, store, type, settle } = await renderWithStore(DrawSettings);

    await type(root.querySelector<HTMLInputElement>('input:not([type])')!, 'Rifa');
    root.querySelector<HTMLButtonElement>('mat-slide-toggle button')!.click();
    await settle();

    expect(store.title()).toBe('Rifa');
    expect(store.removeDuplicates()).toBe(false);
  });

  it('confirms before the official draw and then saves it', async () => {
    const { store, http, button, settle } = await renderWithStore(DrawSettings);
    store.listText.set('Ana\nBruno');
    await settle();

    button('Sortear e salvar')!.click();
    await settle();
    expect(document.querySelector('[role="dialog"] h2')?.textContent?.trim()).toBe('Fazer o sorteio oficial?');

    button('Fazer sorteio oficial')!.click();
    await settle();

    const saved = { publicId: 'aZ3k9QpL0xYt', winners: [{ position: 1, value: 'Ana' }] } as DrawResponse;
    http.expectOne('/api/v1/draws').flush(saved, { status: 201, statusText: 'Created' });
    await settle();
    expect(store.result()).toEqual({ kind: 'official', draw: saved });
  });

  it('does nothing when the official draw is cancelled', async () => {
    const { store, http, button, settle } = await renderWithStore(DrawSettings);
    store.listText.set('Ana\nBruno');
    await settle();

    button('Sortear e salvar')!.click();
    await settle();
    button('Cancelar')!.click();
    await settle();

    http.expectNone('/api/v1/draws');
  });
});
