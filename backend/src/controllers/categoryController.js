const db = require('../db');

// Get categories for a shop (public)
const getCategories = async (req, res) => {
  try {
    const { shop } = req;

    const result = await db.query(
      `SELECT * FROM categories
       WHERE shop_id = $1
       ORDER BY display_order ASC, name ASC`,
      [shop.id]
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create category (admin)
const createCategory = async (req, res) => {
  try {
    const { shopId } = req.user;
    const { name, slug, displayOrder } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const result = await db.query(
      `INSERT INTO categories (shop_id, name, slug, display_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [shopId, name, slug, displayOrder || 0]
    );

    res.status(201).json({
      message: 'Category created successfully',
      category: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Category slug already exists' });
    }
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update category (admin)
const updateCategory = async (req, res) => {
  try {
    const { shopId } = req.user;
    const { id } = req.params;
    const { name, slug, displayOrder } = req.body;

    const result = await db.query(
      `UPDATE categories SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        display_order = COALESCE($3, display_order)
       WHERE id = $4 AND shop_id = $5
       RETURNING *`,
      [name, slug, displayOrder, id, shopId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      message: 'Category updated successfully',
      category: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Category slug already exists' });
    }
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete category (admin)
const deleteCategory = async (req, res) => {
  try {
    const { shopId } = req.user;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM categories WHERE id = $1 AND shop_id = $2 RETURNING id',
      [id, shopId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
