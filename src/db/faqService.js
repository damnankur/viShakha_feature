const { connectToMongo } = require('../db/mongo');
const { normalizeText } = require('../services/retrievalServiceHelpers');
const { textToEmbedding } = require('../services/embeddingService');

/**
 * FAQ Service for managing knowledge base
 */

async function addFAQEntry(type, question, answer, metadata = {}) {
  const db = await connectToMongo();
  const collection = db.collection(type === 'golden' ? 'golden_answers' : 'rag_knowledge');

  const doc = {
    question: question.trim(),
    normalizedQuestion: normalizeText(question),
    answer: answer.trim(),
    remarks: metadata.remarks || null,
    category: metadata.category || 'General',
    tags: metadata.tags || [],
    resources: metadata.resources || [],
    type: type,
    priority: metadata.priority || 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    version: 1,
  };

  if (type === 'rag') {
    doc.embedding = textToEmbedding(`${doc.question} ${doc.answer} ${doc.remarks || ''}`);
  }

  const result = await collection.insertOne(doc);
  return {
    id: result.insertedId,
    type,
    question,
    answer,
  };
}

async function getFAQByCategory(category) {
  const db = await connectToMongo();
  const results = await db
    .collection('golden_answers')
    .find({ category, isActive: true })
    .sort({ priority: -1 })
    .toArray();

  return results;
}

async function searchFAQ(searchTerm) {
  const db = await connectToMongo();
  const normalized = normalizeText(searchTerm);

  // Search in both golden and rag collections
  const [goldenResults, ragResults] = await Promise.all([
    db
      .collection('golden_answers')
      .find({
        $or: [
          { normalizedQuestion: { $regex: normalized, $options: 'i' } },
          { tags: { $in: [normalized] } },
          { answer: { $regex: normalized, $options: 'i' } },
        ],
        isActive: true,
      })
      .limit(5)
      .toArray(),
    db
      .collection('rag_knowledge')
      .find({
        $or: [
          { normalizedQuestion: { $regex: normalized, $options: 'i' } },
          { tags: { $in: [normalized] } },
          { answer: { $regex: normalized, $options: 'i' } },
        ],
        isActive: true,
      })
      .limit(5)
      .toArray(),
  ]);

  return {
    golden: goldenResults,
    rag: ragResults,
  };
}

async function updateFAQEntry(entryId, updates) {
  const db = await connectToMongo();
  const collection = db.collection(updates.type === 'golden' ? 'golden_answers' : 'rag_knowledge');

  const result = await collection.updateOne(
    { _id: entryId },
    {
      $set: {
        ...updates,
        normalizedQuestion: updates.question ? normalizeText(updates.question) : undefined,
        updatedAt: new Date(),
        $inc: { version: 1 },
      },
    }
  );

  return result.modifiedCount > 0;
}

async function getConversationHistory(limit = 50) {
  const db = await connectToMongo();
  const conversations = await db
    .collection('conversations')
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return conversations;
}

async function getConversationBySource(source, limit = 50) {
  const db = await connectToMongo();
  const conversations = await db
    .collection('conversations')
    .find({ source })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return conversations;
}

module.exports = {
  addFAQEntry,
  getFAQByCategory,
  searchFAQ,
  updateFAQEntry,
  getConversationHistory,
  getConversationBySource,
};