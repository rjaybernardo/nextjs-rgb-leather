// Quote every cell, and stop spreadsheet apps treating text as a formula
export const csvCell = (value: unknown) => {
  let text = value === null || value === undefined ? "" : String(value);

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

// Rows to CSV text, with a BOM so Excel reads accented names (e.g. Peñaflor)
// as UTF-8
export const toCsv = (rows: unknown[][]) =>
  "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
