const path = require('path');
const { MongoClient } = require('mongodb');

// Ensure env vars are available when DB scripts are run directly.
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

let client;
let db;

async function connectToMongo() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'vishakha';

  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}

function setDbForTests(mockDb) {
  db = mockDb;
}

async function closeMongo() {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}

module.exports = {
  connectToMongo,
  closeMongo,
  setDbForTests,
};
