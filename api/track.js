const { getSql, json } = require('./_db');

const products = new Set(['lean', 'fit', 'make3']);
const ctas = new Set(['lead-form', 'product-card', 'bundle-shop', 'footer']);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const product = String(req.body?.product || '').toLowerCase();
  const cta = String(req.body?.cta || '').toLowerCase();
  if (!products.has(product) || !ctas.has(cta)) return json(res, 400, { error: 'Invalid tracking event' });

  try {
    const sql = await getSql();
    await sql`INSERT INTO offer_clicks (offer_key, product, cta) VALUES ('makelean', ${product}, ${cta})`;
    return json(res, 200, { ok: true });
  } catch (error) {
    console.error('Click tracking failed:', error.message);
    return json(res, 503, { error: 'Tracking is temporarily unavailable' });
  }
};
