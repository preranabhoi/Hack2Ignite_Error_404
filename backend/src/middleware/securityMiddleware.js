const crypto = require('crypto');

const windows = new Map();

const createRateLimiter = ({ windowMs, max, message }) => (req, res, next) => {
  const key = `${req.ip}:${req.baseUrl}${req.path}`;
  const now = Date.now();
  const current = windows.get(key);

  if (!current || now - current.startedAt >= windowMs) {
    windows.set(key, { startedAt: now, count: 1 });
    return next();
  }

  current.count += 1;
  if (current.count > max) {
    res.set('Retry-After', Math.ceil((windowMs - (now - current.startedAt)) / 1000));
    return res.status(429).json({ success: false, message });
  }

  return next();
};

const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please try again later.',
});

const aiRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many AI requests. Please try again shortly.',
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isSafeImage = (value) => {
  if (typeof value !== 'string' || value.length === 0 || value.length > 5 * 1024 * 1024) {
    return false;
  }

  if (/^https:\/\//i.test(value)) {
    return true;
  }

  const dataUrlMatch = value.match(/^data:(image\/(jpeg|png|webp));base64,([a-z0-9+/=]+)$/i);
  if (!dataUrlMatch) return false;

  return Buffer.byteLength(dataUrlMatch[3], 'base64') <= 3 * 1024 * 1024;
};

const validateImages = (images) => {
  if (images === undefined) return null;
  if (!Array.isArray(images) || images.length > 5 || images.some((image) => !isSafeImage(image))) {
    return 'Images must contain at most 5 HTTPS URLs or JPEG/PNG/WebP data images under 3 MB each.';
  }
  return null;
};

const validateText = (value, field, maxLength) => {
  if (value !== undefined && (typeof value !== 'string' || value.trim().length > maxLength)) {
    return `${field} must be text no longer than ${maxLength} characters.`;
  }
  return null;
};

const createAuditId = () => crypto.randomUUID();

module.exports = {
  authRateLimit,
  aiRateLimit,
  escapeRegex,
  validateImages,
  validateText,
  createAuditId,
};
