const { randomUUID } = require('node:crypto');
const { getSql, json } = require('./_db');

const clean = (value, max) => String(value || '').trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const firstName = clean(req.body?.firstName, 80);
  const lastName = clean(req.body?.lastName, 80);
  const email = clean(req.body?.email, 254).toLowerCase();
  const phone = clean(req.body?.phone, 40);
  const consent = req.body?.consent === true;
  if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email) || !consent) {
    return json(res, 400, { error: 'Please provide a valid name, email, and consent.' });
  }

  try {
    const sql = await getSql();
    await sql`INSERT INTO offer_leads (id, offer_key, first_name, last_name, email, phone, consent)
      VALUES (${randomUUID()}, 'makelean', ${firstName}, ${lastName}, ${email}, ${phone}, ${consent})`;
    return json(res, 201, { ok: true });
  } catch (error) {
    console.error('Lead storage failed:', error.message);
    return json(res, 503, { error: 'We could not save your details. Please try again.' });
  }
};
