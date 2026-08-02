const db = require('../db');

// Get shop info (public)
const getShopInfo = async (req, res) => {
  try {
    const { shop } = req;

    res.json({ shop });
  } catch (error) {
    console.error('Error fetching shop info:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update shop info (admin)
const updateShopInfo = async (req, res) => {
  try {
    const { shopId } = req.user;
    const {
      name,
      logo,
      primaryColor,
      whatsappNumber,
      phone,
      email,
      address,
      instagram,
      facebook,
      businessHours
    } = req.body;

    const result = await db.query(
      `UPDATE shops SET
        name = COALESCE($1, name),
        logo = COALESCE($2, logo),
        primary_color = COALESCE($3, primary_color),
        whatsapp_number = COALESCE($4, whatsapp_number),
        phone = COALESCE($5, phone),
        email = COALESCE($6, email),
        address = COALESCE($7, address),
        instagram = COALESCE($8, instagram),
        facebook = COALESCE($9, facebook),
        business_hours = COALESCE($10, business_hours),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [name, logo, primaryColor, whatsappNumber, phone, email, address, instagram, facebook, businessHours, shopId]
    );

    res.json({
      message: 'Shop info updated successfully',
      shop: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating shop info:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get dashboard stats (admin)
const getDashboardStats = async (req, res) => {
  try {
    const { shopId } = req.user;

    const [productsCount, enquiriesCount, appointmentsCount, categoriesCount] = await Promise.all([
      db.query('SELECT COUNT(*) FROM products WHERE shop_id = $1 AND is_hidden = FALSE', [shopId]),
      db.query('SELECT COUNT(*) FROM enquiries WHERE shop_id = $1 AND status = $2', [shopId, 'pending']),
      db.query('SELECT COUNT(*) FROM appointments WHERE shop_id = $1 AND status = $2', [shopId, 'pending']),
      db.query('SELECT COUNT(*) FROM categories WHERE shop_id = $1', [shopId])
    ]);

    res.json({
      totalProducts: parseInt(productsCount.rows[0].count),
      newEnquiries: parseInt(enquiriesCount.rows[0].count),
      pendingAppointments: parseInt(appointmentsCount.rows[0].count),
      totalCategories: parseInt(categoriesCount.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getShopInfo,
  updateShopInfo,
  getDashboardStats
};
