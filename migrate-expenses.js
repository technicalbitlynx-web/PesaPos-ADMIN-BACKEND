require('dotenv').config();
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS AdminExpense (
      id           TEXT PRIMARY KEY,
      amount       REAL NOT NULL,
      category     TEXT NOT NULL,
      description  TEXT NOT NULL,
      source       TEXT NOT NULL,
      paid_by      TEXT,
      reference    TEXT,
      date         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by   TEXT REFERENCES AdminUser(id),
      created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('AdminExpense table created (or already exists).');
  console.log('Migration complete.');
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
