const db = require('../db');

// Create enquiry (public)
const createEnquiry = async (req, res) => {
  try {
    const { shop } = req;
    const { productId, customerName, customerPhone, message } = req.body;

    if (!customerName || !customerPhone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const name = String(customerName).trim().slice(0, 255);
    const phone = String(customerPhone).trim();

    if (!/^[+]?[\d\s()-]{7,20}$/.test(phone)) {
      return res.status(400).json({ error: 'Please enter a valid phone number' });
    }

    const result = await db.query(
      `INSERT INTO enquiries (shop_id, product_id, customer_name, customer_phone, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [shop.id, productId || null, name, phone, message ? String(message).trim().slice(0, 2000) : null]
    );

    res.status(201).json({
      message: 'Enquiry submitted successfully',
      enquiry: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating enquiry:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all enquiries (admin)
const getEnquiries = async (req, res) => {
  try {
    const { shopId } = req.user;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT e.*, p.name as product_name
      FROM enquiries e
      LEFT JOIN products p ON e.product_id = p.id
      WHERE e.shop_id = $1
    `;
    const params = [shopId];

    if (status) {
      query += ` AND e.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json({ enquiries: result.rows });
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update enquiry status (admin)
const updateEnquiryStatus = async (req, res) => {
  try {
    const { shopId } = req.user;
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'contacted', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await db.query(
      `UPDATE enquiries SET status = $1
       WHERE id = $2 AND shop_id = $3
       RETURNING *`,
      [status, id, shopId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json({
      message: 'Enquiry status updated',
      enquiry: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating enquiry:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createEnquiry,
  getEnquiries,
  updateEnquiryStatus
};
