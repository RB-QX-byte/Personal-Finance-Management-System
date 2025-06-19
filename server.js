require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const { createClient } = require('@clickhouse/client');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const validator = require('validator');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(express.json());
app.use(cookieParser());
app.use(csrf({ cookie: true }));
app.use(express.static(__dirname));

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
});

async function runMigrations() {
  await clickhouse.command(
    `CREATE TABLE IF NOT EXISTS email_verifications (
      user_id UUID,
      token String,
      expires DateTime
    ) ENGINE = MergeTree() ORDER BY (user_id)`
  );
}

async function init() {
  try {
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
    await runMigrations();
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  }
}

init().catch(err => console.error('ClickHouse init error:', err));

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.post('/api/signup', async (req, res) => {
  const { username, password, email, name } = req.body;
  if (!username || !password || !email || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!validator.isStrongPassword(password, { minSymbols: 0 })) {
    return res.status(400).json({ error: 'Weak password' });
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
    const token = require('crypto').randomBytes(32).toString('hex');
    await clickhouse.insert({
      table: 'users',
      values: [{ username, name, email, password: hash, verified: 0 }],
      format: 'JSONEachRow'
    });
    const userIdRes = await clickhouse.query({
      query: 'SELECT id FROM users WHERE username = {u:String}',
      query_params: { u: username },
      format: 'JSONEachRow'
    });
    const [{ id }] = await userIdRes.json();
    await clickhouse.insert({
      table: 'email_verifications',
      values: [{ user_id: id, token, expires: new Date(Date.now() + 24 * 3600 * 1000) }],
      format: 'JSONEachRow'
    });
    console.log(`Verification token for ${email}: ${token}`);
    res.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.get('/api/verify', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send('Invalid token');
  try {
    const result = await clickhouse.query({
      query: 'SELECT user_id FROM email_verifications WHERE token = {t:String} AND expires > now()',
      query_params: { t: token },
      format: 'JSONEachRow'
    });
    const rows = await result.json();
    if (!rows.length) return res.status(400).send('Token invalid or expired');
    const { user_id } = rows[0];
    await clickhouse.command(`ALTER TABLE users UPDATE verified = 1 WHERE id = '${user_id}'`);
    await clickhouse.command(`DELETE FROM email_verifications WHERE token = '${token}'`);
    res.send('Account verified');
  } catch (err) {
    console.error(err);
    res.status(500).send('Verification failed');
  }
});

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

app.post('/api/login', loginLimiter, async (req, res) => {
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
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'strict' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/session', verifyToken, (req, res) => {
  res.json({ authenticated: true });
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });
  console.log(`Contact message from ${name} <${email}>: ${message}`);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
