const { connectToMongo, closeMongo } = require('./mongo');
const { rebuildRagKnowledgeFromFaq } = require('../services/vectorService');

/**
 * Seed RAG knowledge from faq.md only.
 */
async function seedFAQData() {
  try {
    const db = await connectToMongo();
    console.log('Seeding RAG knowledge from faq.md...\n');

    const { insertedCount } = await rebuildRagKnowledgeFromFaq(db);

    console.log(`✓ Inserted ${insertedCount} RAG entries from faq.md`);
    console.log('\n✅ FAQ data seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding FAQ data:', error);
    process.exitCode = 1;
  } finally {
    await closeMongo();
  }
}

if (require.main === module) {
  seedFAQData();
}

module.exports = { seedFAQData };
