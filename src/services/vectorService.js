const { loadFaqEntriesFromDefaultPath } = require('../db/faqMarkdownParser');
const { normalizeText } = require('./retrievalServiceHelpers');
const { textToEmbedding, cosineSimilarity } = require('./embeddingService');

const DEFAULT_RAG_THRESHOLD = Number(process.env.RAG_SIMILARITY_THRESHOLD || 0.28);

function buildRagDocument(entry) {
  const question = entry.question.trim();
  const answer = entry.answer.trim();
  const normalizedQuestion = normalizeText(question);
  const searchableText = `${question} ${answer} ${entry.remarks || ''}`.trim();
  const embedding = textToEmbedding(searchableText);

  return {
    question,
    normalizedQuestion,
    answer,
    remarks: entry.remarks || null,
    type: 'rag',
    isActive: true,
    updatedAt: new Date(),
    createdAt: new Date(),
    embedding,
  };
}

async function rebuildRagKnowledgeFromFaq(db) {
  const faqEntries = loadFaqEntriesFromDefaultPath();
  const collection = db.collection('rag_knowledge');

  await collection.deleteMany({});

  if (!faqEntries.length) {
    return { insertedCount: 0 };
  }

  const docs = faqEntries.map((entry) => buildRagDocument(entry));
  await collection.insertMany(docs, { ordered: true });
  return { insertedCount: docs.length };
}

async function findBestVectorRagMatch(db, question, threshold = DEFAULT_RAG_THRESHOLD) {
  const collection = db.collection('rag_knowledge');
  const docs = await collection.find({ isActive: { $ne: false } }).toArray();
  if (!docs.length) return null;

  const queryEmbedding = textToEmbedding(question);
  let best = { doc: null, score: -1 };

  for (const doc of docs) {
    const docEmbedding = Array.isArray(doc.embedding)
      ? doc.embedding
      : textToEmbedding(`${doc.question || ''} ${doc.answer || ''}`);
    const score = cosineSimilarity(queryEmbedding, docEmbedding);
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
    confidence: Number(best.score.toFixed(4)),
    matchedQuestion: best.doc.question,
  };
}

module.exports = {
  rebuildRagKnowledgeFromFaq,
  findBestVectorRagMatch,
};
