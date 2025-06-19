require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const { createClient } = require('@clickhouse/client');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
});

async function init() {
  await clickhouse.command(
    `CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT generateUUIDv4(),
      username String,
      name String,
      email String,
      password String,
      verified UInt8 DEFAULT 0
    ) ENGINE = MergeTree() ORDER BY (id)`
  );
}

init().catch(err => console.error('ClickHouse init error:', err));

app.post('/api/signup', async (req, res) => {
  const { username, password, email, name } = req.body;
  if (!username || !password || !email || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const check = await clickhouse.query({
      query:
        'SELECT count() AS count FROM users WHERE username = {u:String} OR email = {e:String}',
      query_params: { u: username, e: email },
      format: 'JSONEachRow'
    });
    const [{ count }] = await check.json();
    if (Number(count) > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    await clickhouse.insert({
      table: 'users',
      values: [{ username, name, email, password: hash, verified: 1 }],
      format: 'JSONEachRow'
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }
  try {
    const result = await clickhouse.query({
      query:
        'SELECT * FROM users WHERE (username = {id:String} OR email = {id:String}) AND verified = 1',
      query_params: { id: identifier },
      format: 'JSONEachRow'
    });
    const rows = await result.json();
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
