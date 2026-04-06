const request = require('supertest');
const app = require('../src/app');
const mongo = require('../src/db/mongo');

function createMockDb({ golden = [], rag = [] } = {}) {
  const conversations = [];

  return {
    collection(name) {
      if (name === 'golden_answers') {
        return {
          findOne: async (query) => golden.find((item) => item.normalizedQuestion === query.normalizedQuestion) || null,
          insertOne: async (doc) => ({ insertedId: `${golden.push(doc)}` }),
        };
      }
      if (name === 'rag_knowledge') {
        return {
          find: () => ({ toArray: async () => rag }),
          insertOne: async (doc) => ({ insertedId: `${rag.push(doc)}` }),
        };
      }
      if (name === 'conversations') {
        return {
          insertOne: async (doc) => ({ insertedId: `${conversations.push(doc)}` }),
        };
      }
      throw new Error(`Unknown collection: ${name}`);
    },
  };
}

describe('chat prioritization', () => {
  afterEach(() => {
    mongo.setDbForTests(undefined);
  });

  test('returns golden answer first when exact normalized question exists', async () => {
    mongo.setDbForTests(
      createMockDb({
        golden: [{ question: 'What is Vi-Sakha?', normalizedQuestion: 'what is vi-sakha?', answer: 'Verified answer.' }],
      })
    );

    const response = await request(app).post('/api/chat/ask').send({ question: 'What is Vi-Sakha?' });

    expect(response.status).toBe(200);
    expect(response.body.source).toBe('golden');
    expect(response.body.answer).toBe('Verified answer.');
  });

  test('falls back to rag when golden does not match', async () => {
    mongo.setDbForTests(
      createMockDb({
        rag: [{ question: 'how to upload files', answer: 'Use admin upload endpoint.' }],
      })
    );

    const response = await request(app).post('/api/chat/ask').send({ question: 'How do I upload files?' });

    expect(response.status).toBe(200);
    expect(response.body.source).toBe('rag');
    expect(response.body.answer).toBe('Use admin upload endpoint.');
  });

  test('falls back to mock ai when no db match exists', async () => {
    mongo.setDbForTests(createMockDb());

    const response = await request(app).post('/api/chat/ask').send({ question: 'Something entirely new?' });

    expect(response.status).toBe(200);
    expect(response.body.source).toBe('ai');
    expect(response.body.answer).toContain('Mock AI response');
  });
});
