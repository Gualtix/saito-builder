const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const wrap = (code: number) => (text: string) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text);

export const bold = wrap(1);
export const dim = wrap(2);
export const red = wrap(31);
export const green = wrap(32);
export const yellow = wrap(33);
export const cyan = wrap(36);

export function table(rows: string[][]): string {
  const widths = rows[0]?.map((_, i) => Math.max(...rows.map((r) => stripAnsi(r[i] ?? '').length))) ?? [];
  return rows.map((row) => row.map((cell, i) => cell + ' '.repeat(widths[i]! - stripAnsi(cell).length)).join('  ')).join('\n');
}

function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[\d+m/g, '');
}
