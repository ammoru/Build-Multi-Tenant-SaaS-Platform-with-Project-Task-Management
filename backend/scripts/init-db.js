require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigrations() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  await client.connect();
  console.log('📦 Connected to database');

  const runSqlFiles = async (dir) => {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir).sort();

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;

      const filePath = path.join(dir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`▶ Running ${file}`);

      try {
        await client.query(sql);
      } catch (err) {
        if (
          err.message.includes('already exists') ||
          err.message.includes('duplicate key')
        ) {
          console.log(`⚠️ Skipping ${file} (already applied)`);
        } else {
          throw err;
        }
      }
    }
  };

  await runSqlFiles(path.join(__dirname, '../migrations'));
  await runSqlFiles(path.join(__dirname, '../seeds'));

  console.log('✅ Migrations & seeds completed');
  await client.end();
}

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ DB init failed:', err);
    process.exit(1);
  });
