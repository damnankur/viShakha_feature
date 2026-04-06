function normalizeText(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function legacyNormalizeText(input) {
  return String(input || '').trim().toLowerCase();
}

module.exports = {
  normalizeText,
  legacyNormalizeText,
};
