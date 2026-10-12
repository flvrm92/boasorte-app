/** Spec 001, FR-002: .txt or .csv (UTF-8), up to 1 MB and 10,000 lines, read in the browser. */
export const MAX_FILE_BYTES = 1024 * 1024;
export const MAX_FILE_LINES = 10_000;

const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

export type ParseResult = { ok: true; table: string[][] } | { ok: false; error: string };

export async function parseParticipantsFile(file: File): Promise<ParseResult> {
  const extension = file.name.toLowerCase().match(/\.(txt|csv)$/)?.[1];
  if (!extension) return { ok: false, error: 'Use um arquivo .txt ou .csv.' };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: 'O arquivo deve ter no máximo 1 MB.' };

  const raw = await file.text();
  const text = raw.startsWith(BYTE_ORDER_MARK) ? raw.slice(1) : raw;
  const table = extension === 'txt' ? parseText(text) : await parseCsv(text);

  return table.length > MAX_FILE_LINES
    ? { ok: false, error: 'O arquivo pode ter no máximo 10.000 linhas.' }
    : { ok: true, table };
}

function parseText(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop(); // trailing newline
  return lines.map(line => [line]);
}

async function parseCsv(text: string): Promise<string[][]> {
  // Loaded on demand: only CSV imports need it. Delimiter auto-detected (",", ";", tab or "|"); quotes handled.
  const { default: Papa } = await import('papaparse');
  return Papa.parse<string[]>(text, { skipEmptyLines: 'greedy' }).data;
}

/** Values of one column, optionally skipping the header row. Missing cells become empty strings. */
export function extractColumn(table: readonly string[][], column: number, hasHeader: boolean): string[] {
  return table.slice(hasHeader ? 1 : 0).map(row => row[column] ?? '');
}

/** Choices for the column selector: header names, or "Coluna N". */
export function columnLabels(table: readonly string[][], hasHeader: boolean): string[] {
  const count = Math.max(0, ...table.map(row => row.length));
  return Array.from({ length: count }, (_, i) => (hasHeader && table[0]?.[i]?.trim()) || `Coluna ${i + 1}`);
}
