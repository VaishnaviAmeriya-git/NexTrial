const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const urisToTry = [
    process.env.MONGO_URI,
    'mongodb://127.0.0.1:27017/nextrial',
    'mongodb://localhost:27017/nextrial',
  ].filter(Boolean);

  for (const uri of urisToTry) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}:${conn.connection.port || 27017} (${conn.connection.name})`);
      return conn;
    } catch (err) {
      console.warn(`[Database] Attempt to connect to ${uri} failed: ${err.message}`);
    }
  }

  // Fallback: In-memory MongoDB for local evaluation if standalone without Docker
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('[Database] Initiating embedded MongoMemoryServer fallback...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memUri = mongodInstance.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`[Database] MongoMemoryServer Connected at ${memUri}`);
      return conn;
    } catch (memErr) {
      console.error('[Database] MongoMemoryServer fallback failed:', memErr.message);
      throw memErr;
    }
  } else {
    throw new Error('Could not connect to any MongoDB instance.');
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
