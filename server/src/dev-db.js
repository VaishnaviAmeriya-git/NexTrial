const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

async function startDevMongo() {
  const dbDir = path.join(__dirname, '..', '.db-data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  try {
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbPath: dbDir,
        storageEngine: 'wiredTiger',
      },
    });

    console.log(`[DevMongo] Standalone MongoDB server running on port 27017 at mongodb://127.0.0.1:27017/nextrial`);
    console.log(`[DevMongo] Data persistence path: ${dbDir}`);

    process.on('SIGINT', async () => {
      await mongod.stop();
      process.exit(0);
    });
  } catch (err) {
    console.error('[DevMongo] Error starting local MongoDB:', err.message);
  }
}

if (require.main === module) {
  startDevMongo();
}

module.exports = { startDevMongo };
