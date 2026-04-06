const { connectToMongo } = require('../db/mongo');
const { generateMockAIResponse } = require('./aiService');

function normalizeText(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function legacyNormalizeText(input) {
  return input.trim().toLowerCase();
}

function overlapScore(question, candidateQuestion) {
  const qTokens = new Set(normalizeText(question).split(/\s+/).filter(Boolean));
  const cTokens = new Set(normalizeText(candidateQuestion).split(/\s+/).filter(Boolean));
  if (!qTokens.size || !cTokens.size) return 0;

  let overlap = 0;
  for (const token of qTokens) {
    if (cTokens.has(token)) overlap += 1;
  }

  return overlap / Math.max(qTokens.size, cTokens.size);
}

async function findBestRagMatch(db, question, threshold = 0.3) {
  const docs = await db.collection('rag_knowledge').find({}).toArray();

  let best = { doc: null, score: -1 };
  for (const doc of docs) {
    const score = overlapScore(question, doc.question || '');
    if (score > best.score) {
      best = { doc, score };
    }
  }

  if (!best.doc || best.score < threshold) {
    return null;
  }

  return {
    source: 'rag',
    answer: best.doc.answer,
    confidence: best.score,
    matchedQuestion: best.doc.question,
  };
}

async function getPrioritizedAnswer(question) {
  const db = await connectToMongo();
  const normalizedQuestion = normalizeText(question);
  const legacyNormalizedQuestion = legacyNormalizeText(question);

  let goldenMatch = await db.collection('golden_answers').findOne({
    normalizedQuestion,
  });
  if (!goldenMatch && legacyNormalizedQuestion !== normalizedQuestion) {
    goldenMatch = await db.collection('golden_answers').findOne({
      normalizedQuestion: legacyNormalizedQuestion,
    });
  }
  if (!goldenMatch) {
    const goldenCollection = db.collection('golden_answers');
    if (typeof goldenCollection.find === 'function') {
      const goldenCandidates = await goldenCollection.find({}).toArray();
      goldenMatch = goldenCandidates.find((doc) => {
        const normalizedCandidate = normalizeText(doc.normalizedQuestion || doc.question || '');
        return normalizedCandidate === normalizedQuestion;
      });
    }
  }

  if (goldenMatch) {
    return {
      source: 'golden',
      answer: goldenMatch.answer,
      confidence: 1,
      matchedQuestion: goldenMatch.question,
    };
  }

  const ragMatch = await findBestRagMatch(db, question);
  if (ragMatch) {
    return ragMatch;
  }

  return generateMockAIResponse(question);
}

module.exports = {
  getPrioritizedAnswer,
  normalizeText,
  overlapScore,
};
