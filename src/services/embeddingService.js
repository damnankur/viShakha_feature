function normalizeForEmbedding(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenToIndex(token, dims) {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) % dims;
}

function textToEmbedding(text, dims = 256) {
  const normalized = normalizeForEmbedding(text);
  const vector = Array.from({ length: dims }, () => 0);
  if (!normalized) return vector;

  const tokens = normalized.split(' ').filter(Boolean);
  if (tokens.length === 0) return vector;

  for (const token of tokens) {
    const index = tokenToIndex(token, dims);
    vector[index] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) return vector;

  return vector.map((value) => value / magnitude);
}

function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < vecA.length; i += 1) {
    const a = Number(vecA[i]) || 0;
    const b = Number(vecB[i]) || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }

  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

module.exports = {
  normalizeForEmbedding,
  textToEmbedding,
  cosineSimilarity,
};
