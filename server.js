require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const { createClient } = require('@clickhouse/client');

const app = express();
app.use(express.json());

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
});

async function init() {
  await clickhouse.command(
    `CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT generateUUIDv4(),
      username String,
      password String,
      verified UInt8 DEFAULT 0
    ) ENGINE = MergeTree() ORDER BY (id)`
  );
}

init().catch(err => console.error('ClickHouse init error:', err));

app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await clickhouse.insert({
      table: 'users',
      values: [{ username, password: hash, verified: 1 }],
      format: 'JSONEachRow'
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  try {
    const result = await clickhouse.query({
      query: 'SELECT * FROM users WHERE username = {username:String}',
      query_params: { username },
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
