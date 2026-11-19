const { dayKey, json, pipeline } = require('./_store');

const products = new Set(['lean', 'fit', 'make3']);
const ctas = new Set(['lead-form', 'product-card', 'bundle-shop', 'footer']);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const product = String(req.body?.product || '').toLowerCase();
  const cta = String(req.body?.cta || '').toLowerCase();
  if (!products.has(product) || !ctas.has(cta)) return json(res, 400, { error: 'Invalid tracking event' });

  const day = dayKey();
  try {
    await pipeline([
      ['INCR', 'clicks:total'],
      ['INCR', `clicks:product:${product}`],
      ['INCR', `clicks:cta:${cta}`],
      ['INCR', `clicks:day:${day}`],
      ['INCR', `clicks:day:${day}:${product}`]
    ]);
    return json(res, 200, { ok: true });
  } catch (error) {
    console.error('Click tracking failed:', error.message);
    return json(res, 503, { error: 'Tracking is temporarily unavailable' });
  }
};
