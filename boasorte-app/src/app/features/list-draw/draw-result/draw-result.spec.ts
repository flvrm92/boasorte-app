import { DrawResponse } from '../../../core/api/draw.models';
import { renderWithStore } from '../testing';
import { DrawResult } from './draw-result';

const official = { publicId: 'aZ3k9QpL0xYt', winners: [{ position: 1, value: 'Ana' }] } as DrawResponse;

describe('DrawResult', () => {
  it('invites to draw while there is no result', async () => {
    const { root } = await renderWithStore(DrawResult);

    expect(root.textContent).toContain('Os ganhadores aparecem aqui depois do sorteio.');
  });

  it('shows quick draw winners in order as lottery balls, marked as not saved', async () => {
    const { root, store, settle } = await renderWithStore(DrawResult);

    store.result.set({ kind: 'quick', winners: ['Carla', 'Bruno'] });
    await settle();

    const items = [...root.querySelectorAll('li')].map(li => li.textContent?.replace(/\s+/g, ' ').trim());
    expect(items).toEqual(['1º Carla', '2º Bruno']);
    expect(root.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(root.textContent).toContain('Sorteio rápido, não salvo');
  });

  it('offers to draw again only for quick draws', async () => {
    const { store, button, settle } = await renderWithStore(DrawResult);
    store.listText.set('Ana\nBruno');
    store.result.set({ kind: 'quick', winners: ['Ana'] });
    await settle();
    expect(button('Sortear novamente')).toBeDefined();

    store.result.set({ kind: 'official', draw: official });
    await settle();
    expect(button('Sortear novamente')).toBeUndefined();
  });

  it('shares the official result link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const { root, store, button, settle } = await renderWithStore(DrawResult);

    store.result.set({ kind: 'official', draw: official });
    await settle();

    const link = `${location.origin}/s/aZ3k9QpL0xYt`;
    expect(root.querySelector('a[href="/s/aZ3k9QpL0xYt"]')).not.toBeNull();
    expect(root.textContent).toContain(link);

    button('Copiar link')!.click();
    await settle();

    expect(writeText).toHaveBeenCalledWith(link);
    expect(document.body.textContent).toContain('Link copiado');
    vi.unstubAllGlobals();
  });

  it('explains why saving failed', async () => {
    const { root, store, settle } = await renderWithStore(DrawResult);

    store.saveError.set('Muitos sorteios. Aguarde.');
    await settle();

    expect(root.querySelector('[role="alert"]')?.textContent?.trim()).toBe('Muitos sorteios. Aguarde.');
  });
});
