import { renderWithStore } from '../testing';
import { FileImport } from './file-import';

/** Selects a file and waits until the import had a visible effect (reading and CSV parsing are async). */
async function choose(root: HTMLElement, file: File, settle: () => Promise<unknown>, done: () => boolean) {
  const input = root.querySelector<HTMLInputElement>('input[type="file"]')!;
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new Event('change'));
  await vi.waitFor(async () => {
    await settle();
    if (!done()) throw new Error('import not finished yet');
  });
}

describe('FileImport', () => {
  it('fills the list from a TXT file', async () => {
    const { root, store, settle } = await renderWithStore(FileImport);

    await choose(root, new File(['Ana\nBruno\n'], 'lista.txt'), settle, () => store.listText() !== '');

    expect(store.listText()).toBe('Ana\nBruno');
    expect(store.mode()).toBe('list');
  });

  it('uses a single-column CSV directly', async () => {
    const { root, store, settle } = await renderWithStore(FileImport);

    await choose(root, new File(['Ana\nBruno'], 'lista.csv'), settle, () => store.listText() !== '');

    expect(store.listText()).toBe('Ana\nBruno');
  });

  it('asks which column to use when the CSV has several', async () => {
    const { root, store, button, settle } = await renderWithStore(FileImport);
    await choose(root, new File(['nome;email\nAna;ana@x.com\nBruno;b@x.com'], 'inscritos.csv'), settle, () => !!root.querySelector('select'));

    const select = root.querySelector<HTMLSelectElement>('select')!;
    expect([...select.options].map(o => o.textContent?.trim())).toEqual(['nome', 'email']);
    expect(store.listText()).toBe(''); // nothing applied yet

    select.value = '1';
    select.dispatchEvent(new Event('change'));
    await settle();
    button('Usar esta coluna')!.click();
    await settle();

    expect(store.listText()).toBe('ana@x.com\nb@x.com');
    expect(root.querySelector('select')).toBeNull();
  });

  it('includes the first row when it is not a header', async () => {
    const { root, store, button, settle } = await renderWithStore(FileImport);
    await choose(root, new File(['Ana,1\nBruno,2'], 'sem-cabecalho.csv'), settle, () => !!root.querySelector('select'));

    root.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    await settle();
    button('Usar esta coluna')!.click();
    await settle();

    expect(store.listText()).toBe('Ana\nBruno');
  });

  it('explains files it cannot read and keeps the list', async () => {
    const { root, store, settle } = await renderWithStore(FileImport);
    store.listText.set('Ana');

    await choose(root, new File(['x'], 'planilha.xlsx'), settle, () => !!root.querySelector('[role="alert"]'));

    expect(root.querySelector('[role="alert"]')?.textContent?.trim()).toBe('Use um arquivo .txt ou .csv.');
    expect(store.listText()).toBe('Ana');
  });
});
