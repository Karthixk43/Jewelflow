const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Get all products for a shop (customer view)
const getProducts = async (req, res) => {
  try {
    const { shop } = req;
    const { category, search, sort, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.shop_id = $1 AND p.is_hidden = FALSE
    `;
    const params = [shop.id];
    let paramCount = 1;

    // Filter by category
    if (category) {
      paramCount++;
      query += ` AND c.slug = $${paramCount}`;
      params.push(category);
    }

    // Search
    if (search) {
      paramCount++;
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount} OR p.metal_type ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Sort
    if (sort === 'newest') {
      query += ` ORDER BY p.created_at DESC`;
    } else if (sort === 'price_low') {
      query += ` ORDER BY p.price ASC`;
    } else if (sort === 'price_high') {
      query += ` ORDER BY p.price DESC`;
    } else {
      query += ` ORDER BY p.is_featured DESC, p.is_new_arrival DESC, p.created_at DESC`;
    }

    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json({
      products: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single product by ID
const getProductById = async (req, res) => {
  try {
    const { shop } = req;
    const { id } = req.params;

    const result = await db.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.shop_id = $2`,
      [id, shop.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create product (admin only)
const createProduct = async (req, res) => {
  try {
    const { shopId } = req.user;
    const {
      name,
      description,
      categoryId,
      metalType,
      weight,
      purity,
      stoneDetails,
      price,
      showPrice,
      availability,
      isNewArrival,
      isFeatured,
      images
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const result = await db.query(
      `INSERT INTO products (
        shop_id, category_id, name, description, metal_type, weight, purity,
        stone_details, price, show_price, availability, is_new_arrival, is_featured, images
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        shopId,
        categoryId || null,
        name,
        description || null,
        metalType || null,
        weight || null,
        purity || null,
        stoneDetails || null,
        price || null,
        showPrice || false,
        availability || 'available',
        isNewArrival || false,
        isFeatured || false,
        images || []
      ]
    );

    res.status(201).json({
      message: 'Product created successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update product (admin only)
const updateProduct = async (req, res) => {
  try {
    const { shopId } = req.user;
    const { id } = req.params;

    // Check if product belongs to this shop
    const checkResult = await db.query(
      'SELECT id FROM products WHERE id = $1 AND shop_id = $2',
      [id, shopId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const {
      name,
      description,
      categoryId,
      metalType,
      weight,
      purity,
      stoneDetails,
      price,
      showPrice,
      availability,
      isNewArrival,
      isFeatured,
      isHidden,
      images
    } = req.body;

    const result = await db.query(
      `UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category_id = COALESCE($3, category_id),
        metal_type = COALESCE($4, metal_type),
        weight = COALESCE($5, weight),
        purity = COALESCE($6, purity),
        stone_details = COALESCE($7, stone_details),
        price = COALESCE($8, price),
        show_price = COALESCE($9, show_price),
        availability = COALESCE($10, availability),
        is_new_arrival = COALESCE($11, is_new_arrival),
        is_featured = COALESCE($12, is_featured),
        is_hidden = COALESCE($13, is_hidden),
        images = COALESCE($14, images),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15 AND shop_id = $16
      RETURNING *`,
      [
        name, description, categoryId, metalType, weight, purity, stoneDetails,
        price, showPrice, availability, isNewArrival, isFeatured, isHidden, images,
        id, shopId
      ]
    );

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete product (admin only)
const deleteProduct = async (req, res) => {
  try {
    const { shopId } = req.user;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM products WHERE id = $1 AND shop_id = $2 RETURNING id',
      [id, shopId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all products for admin (includes hidden products)
const getAdminProducts = async (req, res) => {
  try {
    const { shopId } = req.user;

    const result = await db.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.shop_id = $1
       ORDER BY p.created_at DESC`,
      [shopId]
    );

    res.json({ products: result.rows });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts
};
