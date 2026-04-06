const fs = require('fs');
const path = require('path');

function cleanCell(value) {
  return String(value || '')
    .replace(/\r/g, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .trim();
}

function splitMarkdownRow(row) {
  const trimmed = row.trim();
  const body = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const withoutEnd = body.endsWith('|') ? body.slice(0, -1) : body;
  return withoutEnd.split('|').map((cell) => cleanCell(cell));
}

function isDividerRow(row) {
  return /^\|?\s*[-:]+\s*\|/.test(row.trim());
}

function parseFaqMarkdown(markdown) {
  const lines = String(markdown || '').split(/\n/);
  const tableRows = lines.filter((line) => line.trim().startsWith('|'));

  if (tableRows.length < 3) {
    return [];
  }

  const dataRows = tableRows.slice(2).filter((row) => !isDividerRow(row));

  return dataRows
    .map((row) => splitMarkdownRow(row))
    .filter((cells) => cells.length >= 2)
    .map((cells) => ({
      question: cleanCell(cells[0]),
      answer: cleanCell(cells[1]),
      remarks: cleanCell(cells[2] || '') || null,
    }))
    .filter((entry) => entry.question && entry.answer);
}

function loadFaqEntriesFromFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return parseFaqMarkdown(raw);
}

function loadFaqEntriesFromDefaultPath() {
  const faqPath = path.resolve(__dirname, '../../faq.md');
  return loadFaqEntriesFromFile(faqPath);
}

module.exports = {
  parseFaqMarkdown,
  loadFaqEntriesFromFile,
  loadFaqEntriesFromDefaultPath,
};
