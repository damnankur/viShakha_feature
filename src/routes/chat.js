const express = require('express');
const rateLimit = require('express-rate-limit');
const { getPrioritizedAnswer, normalizeText } = require('../services/retrievalService');
const { connectToMongo } = require('../db/mongo');

const router = express.Router();
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(chatLimiter);

router.post('/ask', async (req, res, next) => {
  try {
    const question = (req.body?.question || '').trim();
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    const answer = await getPrioritizedAnswer(question);
    const db = await connectToMongo();

    await db.collection('conversations').insertOne({
      question,
      normalizedQuestion: normalizeText(question),
      answer: answer.answer,
      source: answer.source,
      createdAt: new Date(),
    });

    return res.json({ question, ...answer });
  } catch (error) {
    return next(error);
  }
});

router.post('/admin/knowledge', async (req, res, next) => {
  try {
    const { type, question, answer } = req.body || {};
    if (!['golden', 'rag'].includes(type)) {
      return res.status(400).json({ error: 'type must be either golden or rag' });
    }
    if (!question || !answer) {
      return res.status(400).json({ error: 'question and answer are required' });
    }

    const db = await connectToMongo();
    const targetCollection = type === 'golden' ? 'golden_answers' : 'rag_knowledge';

    const doc = {
      question,
      normalizedQuestion: normalizeText(question),
      answer,
      createdAt: new Date(),
    };

    const result = await db.collection(targetCollection).insertOne(doc);
    return res.status(201).json({ id: result.insertedId, type, question, answer });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
