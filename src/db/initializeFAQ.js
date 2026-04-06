const { connectToMongo, closeMongo } = require('./mongo');

/**
 * Initialize FAQ collections with schema validation
 * Run this script once to set up the database
 */
async function initializeFAQDatabase() {
  try {
    const db = await connectToMongo();
    console.log('Initializing FAQ collections...');

    // Create golden_answers collection with validation schema (if it doesn't exist)
    try {
      await db.createCollection('golden_answers', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['question', 'answer', 'normalizedQuestion', 'type'],
            properties: {
              _id: { bsonType: 'objectId' },
              question: {
                bsonType: 'string',
                description: 'FAQ question text',
                minLength: 5,
                maxLength: 500,
              },
              normalizedQuestion: {
                bsonType: 'string',
                description: 'Normalized question for matching (lowercase, trimmed)',
              },
              answer: {
                bsonType: 'string',
                description: 'Detailed answer to the question',
              },
              remarks: {
                bsonType: ['string', 'null'],
                description: 'Additional remarks or notes',
              },
              category: {
                bsonType: 'string',
                description: 'FAQ category for organization',
                enum: [
                  'Internship Overview',
                  'ViBe Platform',
                  'Communication',
                  'Case Studies & Submissions',
                  'Slot Booking',
                  'General',
                ],
              },
              tags: {
                bsonType: 'array',
                items: { bsonType: 'string' },
                description: 'Search tags for better discoverability',
              },
              resources: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    name: { bsonType: 'string' },
                    url: { bsonType: 'string' },
                    type: {
                      bsonType: 'string',
                      enum: ['website', 'telegram', 'form', 'documentation'],
                    },
                  },
                },
                description: 'Related resources and links',
              },
              type: {
                bsonType: 'string',
                enum: ['golden', 'rag'],
                description: 'Knowledge base type',
              },
              priority: {
                bsonType: 'int',
                description: 'Priority score for ranking (higher = more important)',
              },
              createdAt: {
                bsonType: 'date',
                description: 'Timestamp when entry was created',
              },
              updatedAt: {
                bsonType: 'date',
                description: 'Timestamp when entry was last updated',
              },
              isActive: {
                bsonType: 'bool',
                description: 'Whether this FAQ entry is active',
              },
              version: {
                bsonType: 'int',
                description: 'Version number for tracking updates',
              },
            },
          },
        },
      });
      console.log('✓ golden_answers collection created');
    } catch (error) {
      if (error.codeName === 'NamespaceExists') {
        console.log('✓ golden_answers collection already exists');
      } else {
        throw error;
      }
    }

    // Create rag_knowledge collection with validation schema
    try {
      await db.createCollection('rag_knowledge', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['question', 'answer', 'normalizedQuestion', 'type'],
            properties: {
              _id: { bsonType: 'objectId' },
              question: {
                bsonType: 'string',
                description: 'FAQ question text',
                minLength: 5,
                maxLength: 500,
              },
              normalizedQuestion: {
                bsonType: 'string',
                description: 'Normalized question for matching',
              },
              answer: {
                bsonType: 'string',
                description: 'Detailed answer to the question',
              },
              remarks: {
                bsonType: ['string', 'null'],
                description: 'Additional remarks or notes',
              },
              category: {
                bsonType: 'string',
                description: 'FAQ category for organization',
                enum: [
                  'Internship Overview',
                  'ViBe Platform',
                  'Communication',
                  'Case Studies & Submissions',
                  'Slot Booking',
                  'General',
                ],
              },
              tags: {
                bsonType: 'array',
                items: { bsonType: 'string' },
              },
              resources: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    name: { bsonType: 'string' },
                    url: { bsonType: 'string' },
                    type: {
                      bsonType: 'string',
                      enum: ['website', 'telegram', 'form', 'documentation'],
                    },
                  },
                },
              },
              type: {
                bsonType: 'string',
                enum: ['golden', 'rag'],
                description: 'Knowledge base type',
              },
              matchScore: {
                bsonType: ['double', 'null'],
                description: 'RAG similarity score (0-1)',
              },
              createdAt: {
                bsonType: 'date',
              },
              updatedAt: {
                bsonType: 'date',
              },
              isActive: {
                bsonType: 'bool',
              },
            },
          },
        },
      });
      console.log('✓ rag_knowledge collection created');
    } catch (error) {
      if (error.codeName === 'NamespaceExists') {
        console.log('✓ rag_knowledge collection already exists');
      } else {
        throw error;
      }
    }

    // Create conversations collection
    try {
      await db.createCollection('conversations', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['question', 'answer', 'source', 'normalizedQuestion'],
            properties: {
              _id: { bsonType: 'objectId' },
              question: { bsonType: 'string' },
              normalizedQuestion: { bsonType: 'string' },
              answer: { bsonType: 'string' },
              source: {
                bsonType: 'string',
                enum: ['golden', 'rag', 'ai'],
                description: 'Source of the answer',
              },
              matchedQuestion: {
                bsonType: ['string', 'null'],
                description: 'Original FAQ question that was matched',
              },
              matchScore: {
                bsonType: ['double', 'null'],
                description: 'Similarity score for RAG matches',
              },
              createdAt: {
                bsonType: 'date',
              },
            },
          },
        },
      });
      console.log('✓ conversations collection created');
    } catch (error) {
      if (error.codeName === 'NamespaceExists') {
        console.log('✓ conversations collection already exists');
      } else {
        throw error;
      }
    }

    // Create indexes for better query performance
    console.log('Creating indexes...');

    // golden_answers indexes
    await db.collection('golden_answers').createIndex({ normalizedQuestion: 1 }, { unique: true });
    await db.collection('golden_answers').createIndex({ tags: 1 });
    await db.collection('golden_answers').createIndex({ category: 1 });
    await db.collection('golden_answers').createIndex({ createdAt: -1 });
    console.log('✓ golden_answers indexes created');

    // rag_knowledge indexes
    await db.collection('rag_knowledge').createIndex({ normalizedQuestion: 1 });
    await db.collection('rag_knowledge').createIndex({ tags: 1 });
    await db.collection('rag_knowledge').createIndex({ category: 1 });
    await db.collection('rag_knowledge').createIndex({ matchScore: -1 });
    console.log('✓ rag_knowledge indexes created');

    // conversations indexes
    await db.collection('conversations').createIndex({ createdAt: -1 });
    await db.collection('conversations').createIndex({ source: 1 });
    await db.collection('conversations').createIndex({ normalizedQuestion: 1 });
    console.log('✓ conversations indexes created');

    console.log('\n✅ FAQ database initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing FAQ database:', error);
    process.exitCode = 1;
  } finally {
    await closeMongo();
  }
}

if (require.main === module) {
  initializeFAQDatabase();
}

module.exports = { initializeFAQDatabase };