const db = require('../db');

const identifyShop = async (req, res, next) => {
  try {
    // Query param takes priority: a logged-in admin browsing another shop's
    // public storefront sends their own x-shop-slug header automatically,
    // which must NOT override the shop being viewed.
    const shopSlug = req.query.shop || req.headers['x-shop-slug'];

    if (!shopSlug) {
      return res.status(400).json({ error: 'Shop identifier required' });
    }

    const result = await db.query(
      'SELECT * FROM shops WHERE slug = $1',
      [shopSlug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    req.shop = result.rows[0];
    next();
  } catch (error) {
    console.error('Error identifying shop:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { identifyShop };
