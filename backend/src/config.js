const parseBoolean = (value) => {
  if (typeof value !== 'string') return false;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
};

const getDatabaseConfig = () => {
  const sslEnabled = parseBoolean(process.env.DB_SSL) || process.env.NODE_ENV === 'production';
  const ssl = sslEnabled ? { rejectUnauthorized: false } : false;

  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl,
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl,
  };
};

const getCorsOrigins = () => {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:3000';
  return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const getServerHost = () => process.env.HOST || '0.0.0.0';

module.exports = {
  getDatabaseConfig,
  getCorsOrigins,
  getServerHost,
};
