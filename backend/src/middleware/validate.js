const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Router param validator: returns 404 for malformed UUIDs instead of a DB error (500)
const validateUuid = (req, res, next, value) => {
  if (!UUID_RE.test(value)) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
};

module.exports = { validateUuid, UUID_RE };
