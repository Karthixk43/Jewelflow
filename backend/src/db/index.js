const { pool } = require('./setup');

const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', { text, duration, rows: res.rowCount });
  }

  return res;
};

const getClient = () => pool.connect();

module.exports = {
  query,
  getClient,
  pool,
};
