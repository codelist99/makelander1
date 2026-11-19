let sqlPromise;
let schemaPromise;

async function getSql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
  if (!sqlPromise) {
    sqlPromise = import('@neondatabase/serverless').then(({ neon }) => neon(process.env.DATABASE_URL));
  }
  const sql = await sqlPromise;
  if (!schemaPromise) {
    schemaPromise = Promise.all([
      sql`CREATE TABLE IF NOT EXISTS offer_clicks (
        id BIGSERIAL PRIMARY KEY,
        offer_key TEXT NOT NULL,
        product TEXT NOT NULL,
        cta TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS offer_leads (
        id UUID PRIMARY KEY,
        offer_key TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL DEFAULT '',
        consent BOOLEAN NOT NULL,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
    ]).then(() => Promise.all([
      sql`CREATE INDEX IF NOT EXISTS offer_clicks_offer_created_idx ON offer_clicks (offer_key, created_at DESC)`,
      sql`CREATE INDEX IF NOT EXISTS offer_leads_offer_submitted_idx ON offer_leads (offer_key, submitted_at DESC)`
    ])).catch(error => {
      schemaPromise = undefined;
      throw error;
    });
  }
  await schemaPromise;
  return sql;
}

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

module.exports = { getSql, json };
