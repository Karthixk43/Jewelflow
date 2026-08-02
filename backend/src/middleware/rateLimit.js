// Simple in-memory rate limiter (no external dependency).
// Good enough for a single-server deployment; swap for express-rate-limit + Redis if you scale out.
const buckets = new Map();

// Periodically clean old entries so memory doesn't grow forever
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of buckets) {
    const recent = times.filter((t) => now - t < 15 * 60 * 1000);
    if (recent.length === 0) buckets.delete(key);
    else buckets.set(key, recent);
  }
}, 10 * 60 * 1000).unref();

const rateLimit = ({ windowMs = 60 * 1000, max = 30, message = 'Too many requests. Please try again later.' } = {}) => {
  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const times = (buckets.get(key) || []).filter((t) => now - t < windowMs);

    if (times.length >= max) {
      return res.status(429).json({ error: message });
    }

    times.push(now);
    buckets.set(key, times);
    next();
  };
};

module.exports = { rateLimit };
