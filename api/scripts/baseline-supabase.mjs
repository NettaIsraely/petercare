import { config } from 'dotenv';
import pg from 'pg';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../..');
config({ path: join(rootDir, '.env') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to baseline Supabase.');
}

const migrationTimestamp = 1781268467369;
const migrationName = 'InitialSchema1781268467369';

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS "migrations" (
    "id" SERIAL NOT NULL,
    "timestamp" bigint NOT NULL,
    "name" character varying NOT NULL,
    CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY ("id")
  )
`);

const existing = await client.query(
  'SELECT 1 FROM "migrations" WHERE "timestamp" = $1 AND "name" = $2',
  [migrationTimestamp, migrationName],
);

if (existing.rowCount === 0) {
  await client.query(
    'INSERT INTO "migrations" ("timestamp", "name") VALUES ($1, $2)',
    [migrationTimestamp, migrationName],
  );
  console.log(`Baselined migration ${migrationName} on Supabase.`);
} else {
  console.log(`Migration ${migrationName} is already recorded on Supabase.`);
}

await client.end();
