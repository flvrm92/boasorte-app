import { columnLabels, extractColumn, MAX_FILE_BYTES, MAX_FILE_LINES, parseParticipantsFile } from './parse-file';

const file = (content: string, name: string) => new File([content], name, { type: 'text/plain' });

async function table(content: string, name: string) {
  const result = await parseParticipantsFile(file(content, name));
  if (!result.ok) throw new Error(`expected success, got: ${result.error}`);
  return result.table;
}

describe('parseParticipantsFile', () => {
  it('reads a TXT file with one participant per line (LF or CRLF)', async () => {
    expect(await table('Ana\r\nBruno\nCarla\n', 'lista.txt')).toEqual([['Ana'], ['Bruno'], ['Carla']]);
  });

  it('removes the UTF-8 byte order mark', async () => {
    expect(await table('﻿Ana\nBruno', 'lista.TXT')).toEqual([['Ana'], ['Bruno']]);
  });

  it('reads a comma separated CSV', async () => {
    expect(await table('nome,email\nAna,ana@x.com\nBruno,b@x.com', 'inscritos.csv')).toEqual([
      ['nome', 'email'],
      ['Ana', 'ana@x.com'],
      ['Bruno', 'b@x.com'],
    ]);
  });

  it('reads a semicolon separated CSV (Excel pt-BR)', async () => {
    expect(await table('nome;cidade\nAna;Recife\n', 'inscritos.csv')).toEqual([
      ['nome', 'cidade'],
      ['Ana', 'Recife'],
    ]);
  });

  it('keeps separators inside quoted fields', async () => {
    expect(await table('nome,obs\n"Silva, Ana","disse ""oi"""', 'q.csv')).toEqual([
      ['nome', 'obs'],
      ['Silva, Ana', 'disse "oi"'],
    ]);
  });

  it('rejects other extensions', async () => {
    expect(await parseParticipantsFile(file('Ana', 'lista.xlsx'))).toEqual({ ok: false, error: 'Use um arquivo .txt ou .csv.' });
  });

  it('rejects files larger than 1 MB', async () => {
    const result = await parseParticipantsFile(file('x'.repeat(MAX_FILE_BYTES + 1), 'grande.txt'));

    expect(result).toEqual({ ok: false, error: 'O arquivo deve ter no máximo 1 MB.' });
  });

  it('rejects files with more than 10,000 lines', async () => {
    const content = Array.from({ length: MAX_FILE_LINES + 1 }, (_, i) => `P${i}`).join('\n');

    expect(await parseParticipantsFile(file(content, 'muitos.txt'))).toEqual({
      ok: false,
      error: 'O arquivo pode ter no máximo 10.000 linhas.',
    });
  });
});

describe('CSV columns', () => {
  const rows = [
    ['nome', 'email'],
    ['Ana', 'ana@x.com'],
    ['Bruno'],
  ];

  it('extracts a column, skipping the header when asked', () => {
    expect(extractColumn(rows, 0, true)).toEqual(['Ana', 'Bruno']);
    expect(extractColumn(rows, 1, false)).toEqual(['email', 'ana@x.com', '']);
  });

  it('labels columns with the header or by position', () => {
    expect(columnLabels(rows, true)).toEqual(['nome', 'email']);
    expect(columnLabels(rows, false)).toEqual(['Coluna 1', 'Coluna 2']);
  });
});
