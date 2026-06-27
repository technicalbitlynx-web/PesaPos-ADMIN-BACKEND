require('dotenv').config();
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  await client.execute(`ALTER TABLE License ADD COLUMN manager_slots INTEGER`).catch((e) => {
    if (e.message?.includes('duplicate column')) console.log('manager_slots already exists');
    else throw e;
  });
  await client.execute(`ALTER TABLE License ADD COLUMN pos_slots INTEGER`).catch((e) => {
    if (e.message?.includes('duplicate column')) console.log('pos_slots already exists');
    else throw e;
  });
  console.log('License slot columns added. Done.');
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
