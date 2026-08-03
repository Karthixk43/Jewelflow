const { Pool } = require('pg');
require('dotenv').config();
const { getDatabaseConfig } = require('../config');

const pool = new Pool(getDatabaseConfig());

// Prevent uncaught exceptions on idle client errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err);
});

const createTables = async () => {
  const client = await pool.connect();

  try {
    console.log('Creating tables...');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    // Shops table (multi-tenant)
    await client.query(`
      CREATE TABLE IF NOT EXISTS shops (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        logo TEXT,
        primary_color VARCHAR(7) DEFAULT '#C9A227',
        whatsapp_number VARCHAR(20),
        phone VARCHAR(20),
        email VARCHAR(255),
        address TEXT,
        instagram VARCHAR(255),
        facebook VARCHAR(255),
        business_hours TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Users table (admin login per shop)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tokens are stored as hashes so a database leak cannot be used to reset passwords.
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(shop_id, slug)
      )
    `);

    // Products table (jewellery items)
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        metal_type VARCHAR(100),
        weight DECIMAL(10, 2),
        purity VARCHAR(50),
        stone_details TEXT,
        price DECIMAL(12, 2),
        show_price BOOLEAN DEFAULT FALSE,
        availability VARCHAR(50) DEFAULT 'available',
        is_new_arrival BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE,
        is_hidden BOOLEAN DEFAULT FALSE,
        images TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Enquiries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(20),
        message TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Appointments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes for performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_categories_shop_id ON categories(shop_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_enquiries_shop_id ON enquiries(shop_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_shop_id ON appointments(shop_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash)`);

    console.log('✓ All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run if executed directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('Database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { pool, createTables };
