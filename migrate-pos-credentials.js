/**
 * Idempotent migration: creates PosDeviceCredential table in Turso.
 * Run: node migrate-pos-credentials.js
 */
require('dotenv').config();
const { createClient } = require('@libsql/client');

async function main() {
  const db = createClient({
    url:       process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  const tableExists = async (name) => {
    const r = await db.execute({ sql: `SELECT name FROM sqlite_master WHERE type='table' AND name=?`, args: [name] });
    return r.rows.length > 0;
  };
  const indexExists = async (name) => {
    const r = await db.execute({ sql: `SELECT name FROM sqlite_master WHERE type='index' AND name=?`, args: [name] });
    return r.rows.length > 0;
  };

  if (!await tableExists('PosDeviceCredential')) {
    console.log('Creating PosDeviceCredential table...');
    await db.execute({
      sql: `CREATE TABLE PosDeviceCredential (
        id               TEXT PRIMARY KEY,
        license_key      TEXT NOT NULL,
        slot_name        TEXT NOT NULL,
        access_code_hash TEXT NOT NULL,
        device_id        TEXT,
        is_active        INTEGER NOT NULL DEFAULT 1,
        created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      )`,
      args: [],
    });
    console.log('  Table created.');
  } else {
    console.log('PosDeviceCredential already exists — skipping CREATE.');
  }

  if (!await indexExists('PDC_unique_license_slot')) {
    await db.execute({ sql: `CREATE UNIQUE INDEX PDC_unique_license_slot ON PosDeviceCredential(license_key, slot_name)`, args: [] });
    console.log('  Unique index created.');
  }
  if (!await indexExists('PDC_license_key_idx')) {
    await db.execute({ sql: `CREATE INDEX PDC_license_key_idx ON PosDeviceCredential(license_key)`, args: [] });
    console.log('  License key index created.');
  }

  console.log('Migration complete.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
