const { timingSafeEqual } = require('node:crypto');
const { json, pipeline } = require('./_store');

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD || '';
  const supplied = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return Boolean(expected && left.length === right.length && timingSafeEqual(left, right));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!authorized(req)) return json(res, 401, { error: 'Invalid admin password' });

  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (29 - index));
    return date.toISOString().slice(0, 10);
  });
  const commands = [
    ['GET', 'clicks:total'], ['GET', 'clicks:product:lean'], ['GET', 'clicks:product:fit'],
    ['GET', 'clicks:product:make3'], ['GET', 'leads:total'], ['LRANGE', 'leads:recent', '0', '199'],
    ...days.map(day => ['GET', `clicks:day:${day}`]),
    ...days.map(day => ['GET', `leads:day:${day}`])
  ];

  try {
    const values = await pipeline(commands);
    const number = value => Number(value || 0);
    const leads = (values[5] || []).map(value => JSON.parse(value));
    return json(res, 200, {
      totals: { clicks: number(values[0]), lean: number(values[1]), fit: number(values[2]), make3: number(values[3]), leads: number(values[4]) },
      daily: days.map((day, index) => ({ day, clicks: number(values[6 + index]), leads: number(values[36 + index]) })),
      leads
    });
  } catch (error) {
    console.error('Admin stats failed:', error.message);
    return json(res, 503, { error: 'Dashboard data is temporarily unavailable' });
  }
};
