const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

function configured() {
  return Boolean(redisUrl && redisToken);
}

async function redis(command) {
  if (!configured()) throw new Error('The click-tracking data store is not configured.');

  const response = await fetch(redisUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error(payload.error || 'Data-store request failed.');
  return payload.result;
}

async function pipeline(commands) {
  if (!configured()) throw new Error('The click-tracking data store is not configured.');

  const response = await fetch(`${redisUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });
  const payload = await response.json();
  if (!response.ok || !Array.isArray(payload)) throw new Error('Data-store request failed.');
  return payload.map(item => item.result);
}

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

module.exports = { configured, dayKey, json, pipeline, redis };
