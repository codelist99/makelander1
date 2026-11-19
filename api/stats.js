const { timingSafeEqual } = require('node:crypto');
const { getSql, json } = require('./_db');

function authorized(req) {
  const expected = process.env.ADMIN_PIN || '67';
  const supplied = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return Boolean(left.length === right.length && timingSafeEqual(left, right));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!authorized(req)) return json(res, 401, { error: 'Invalid admin password' });

  try {
    const sql = await getSql();
    const [clickTotals, leadTotal, clickDays, leadDays, leadRows] = await Promise.all([
      sql`SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE product = 'lean')::int AS lean,
        COUNT(*) FILTER (WHERE product = 'fit')::int AS fit,
        COUNT(*) FILTER (WHERE product = 'make3')::int AS make3
        FROM offer_clicks WHERE offer_key = 'makelean'`,
      sql`SELECT COUNT(*)::int AS total FROM offer_leads WHERE offer_key = 'makelean'`,
      sql`SELECT TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(*)::int AS total
        FROM offer_clicks WHERE offer_key = 'makelean' AND created_at >= CURRENT_DATE - INTERVAL '29 days'
        GROUP BY 1 ORDER BY 1`,
      sql`SELECT TO_CHAR(submitted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(*)::int AS total
        FROM offer_leads WHERE offer_key = 'makelean' AND submitted_at >= CURRENT_DATE - INTERVAL '29 days'
        GROUP BY 1 ORDER BY 1`,
      sql`SELECT id, first_name, last_name, email, phone, consent, submitted_at
        FROM offer_leads WHERE offer_key = 'makelean' ORDER BY submitted_at DESC LIMIT 200`
    ]);
    const clickMap = new Map(clickDays.map(row => [row.day, Number(row.total)]));
    const leadMap = new Map(leadDays.map(row => [row.day, Number(row.total)]));
    const days = Array.from({ length: 30 }, (_, index) => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - (29 - index));
      return date.toISOString().slice(0, 10);
    });
    const totals = clickTotals[0] || { total: 0, lean: 0, fit: 0, make3: 0 };
    return json(res, 200, {
      totals: { clicks: Number(totals.total), lean: Number(totals.lean), fit: Number(totals.fit), make3: Number(totals.make3), leads: Number(leadTotal[0]?.total || 0) },
      daily: days.map(day => ({ day, clicks: clickMap.get(day) || 0, leads: leadMap.get(day) || 0 })),
      leads: leadRows.map(row => ({ id: row.id, firstName: row.first_name, lastName: row.last_name, email: row.email, phone: row.phone, consent: row.consent, submittedAt: row.submitted_at }))
    });
  } catch (error) {
    console.error('Admin stats failed:', error.message);
    return json(res, 503, { error: 'Dashboard data is temporarily unavailable' });
  }
};
