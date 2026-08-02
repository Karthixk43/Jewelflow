require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { getCorsOrigins, getServerHost } = require('./config');

// Fail fast if critical config is missing/insecure
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change_this')) {
  console.error('FATAL: JWT_SECRET is missing or still the default. Set a strong secret in .env');
  process.exit(1);
}

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const shopRoutes = require('./routes/shops');
const enquiryRoutes = require('./routes/enquiries');
const appointmentRoutes = require('./routes/appointments');
const uploadRoutes = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 5000;

// Behind a reverse proxy (Render/Railway/nginx) so req.ip reflects the real
// client — required for per-user rate limiting to work correctly.
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: getCorsOrigins(),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Serve uploaded files (cache for a day — filenames are UUIDs so they never change)
const { uploadDir } = require('./utils/upload');
app.use('/uploads', express.static(uploadDir, { maxAge: '1d', immutable: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Render builds the frontend before starting this service. Serving both layers
// from one origin keeps production API requests simple and avoids CORS drift.
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist, { index: false, maxAge: '1h' }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }

    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 handler (before error handler)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, getServerHost(), () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
