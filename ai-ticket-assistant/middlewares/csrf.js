// Simple CSRF protection middleware
export const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests
  if (req.method === 'GET') {
    return next();
  }
  
  const token = req.headers['x-csrf-token'];
  
  // For development, we'll accept any token that exists
  // In production, implement proper token validation
  if (!token) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }
  
  next();
};