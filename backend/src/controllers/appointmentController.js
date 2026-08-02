const db = require('../db');

// Create appointment (public)
const createAppointment = async (req, res) => {
  try {
    const { shop } = req;
    const { customerName, customerPhone, appointmentDate, appointmentTime, notes } = req.body;

    if (!customerName || !customerPhone || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const name = String(customerName).trim().slice(0, 255);
    const phone = String(customerPhone).trim();

    if (!/^[+]?[\d\s()-]{7,20}$/.test(phone)) {
      return res.status(400).json({ error: 'Please enter a valid phone number' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate) || isNaN(Date.parse(appointmentDate))) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(appointmentTime)) {
      return res.status(400).json({ error: 'Invalid time' });
    }

    const result = await db.query(
      `INSERT INTO appointments (shop_id, customer_name, customer_phone, appointment_date, appointment_time, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [shop.id, name, phone, appointmentDate, appointmentTime, notes ? String(notes).trim().slice(0, 2000) : null]
    );

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all appointments (admin)
const getAppointments = async (req, res) => {
  try {
    const { shopId } = req.user;
    const { status, date } = req.query;

    let query = 'SELECT * FROM appointments WHERE shop_id = $1';
    const params = [shopId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (date) {
      params.push(date);
      query += ` AND appointment_date = $${params.length}`;
    }

    query += ' ORDER BY appointment_date ASC, appointment_time ASC';

    const result = await db.query(query, params);

    res.json({ appointments: result.rows });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update appointment status (admin)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { shopId } = req.user;
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await db.query(
      `UPDATE appointments SET status = $1
       WHERE id = $2 AND shop_id = $3
       RETURNING *`,
      [status, id, shopId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      message: 'Appointment status updated',
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointmentStatus
};
