const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { sendPasswordResetEmail, isEmailConfigured } = require('../services/email');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const genericResetResponse = { message: 'If that account has a recovery email, we sent password reset instructions.' };
const getResetResponse = (token) => {
  if (process.env.NODE_ENV !== 'production' && token) {
    const appUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    return { ...genericResetResponse, resetUrl: `${appUrl}/admin/reset-password?token=${encodeURIComponent(token)}` };
  }
  return genericResetResponse;
};

// Register a new shop with admin user
const registerShop = async (req, res) => {
  let client;

  try {
    const {
      shopName,
      shopSlug,
      username,
      password,
      fullName,
      whatsappNumber,
      phone,
      email
    } = req.body;

    // Validate required fields
    if (!shopName || !shopSlug || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(shopSlug)) {
      return res.status(400).json({ error: 'Slug must be 3-50 characters: lowercase letters, numbers and hyphens only' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Username must be 3-50 characters' });
    }

    client = await db.getClient();
    await client.query('BEGIN');

    // Check if shop slug already exists
    const existingShop = await client.query(
      'SELECT id FROM shops WHERE slug = $1',
      [shopSlug]
    );

    if (existingShop.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Shop slug already taken' });
    }

    // Check if username already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create shop
    const shopResult = await client.query(
      `INSERT INTO shops (name, slug, whatsapp_number, phone, email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [shopName, shopSlug, whatsappNumber, phone, email]
    );

    const shop = shopResult.rows[0];

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const userResult = await client.query(
      `INSERT INTO users (shop_id, username, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING id, shop_id, username, full_name, role`,
      [shop.id, username, passwordHash, fullName]
    );

    const user = userResult.rows[0];

    await client.query('COMMIT');

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        shopId: shop.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Shop registered successfully',
      shop: {
        id: shop.id,
        name: shop.name,
        slug: shop.slug
      },
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name
      },
      token
    });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }
    console.error('Error registering shop:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const result = await db.query(
      `SELECT u.*, s.name as shop_name, s.slug as shop_slug
       FROM users u
       JOIN shops s ON u.shop_id = s.id
       WHERE u.username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        shopId: user.shop_id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      shop: {
        id: user.shop_id,
        name: user.shop_name,
        slug: user.shop_slug
      },
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name
      },
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const requestPasswordReset = async (req, res) => {
  const identifier = req.body.identifier?.trim();

  if (!identifier) {
    return res.status(400).json({ error: 'Enter your username or shop email address' });
  }

  if (!isEmailConfigured() && process.env.NODE_ENV === 'production') {
    console.error('Password reset requested but SMTP is not configured');
    return res.status(503).json({ error: 'Password recovery is temporarily unavailable. Please contact support.' });
  }

  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.full_name, s.name AS shop_name, s.email
       FROM users u
       JOIN shops s ON s.id = u.shop_id
       WHERE LOWER(u.username) = LOWER($1) OR LOWER(s.email) = LOWER($1)
       LIMIT 1`,
      [identifier]
    );

    // Keep the response identical for unknown accounts to avoid account enumeration.
    if (result.rows.length === 0 || !result.rows[0].email) {
      return res.json(genericResetResponse);
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1 OR expires_at < NOW()', [user.id]);
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    );

    if (isEmailConfigured()) {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.full_name || user.username,
        shopName: user.shop_name,
        token
      });
    } else {
      console.warn('SMTP is not configured; returning the password reset link only in development mode');
    }

    return res.json(getResetResponse(token));
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return res.status(500).json({ error: 'Unable to process password recovery. Please try again later.' });
  }
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Reset link and new password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  let client;

  try {
    client = await db.getClient();
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND expires_at > NOW()
       FOR UPDATE`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This reset link is invalid or has expired' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, result.rows[0].user_id]);
    await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [result.rows[0].user_id]);
    await client.query('COMMIT');
    return res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: 'Unable to reset password. Please try again later.' });
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = {
  registerShop,
  login,
  requestPasswordReset,
  resetPassword
};
