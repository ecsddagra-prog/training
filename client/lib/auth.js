import jwt from 'jsonwebtoken';

export function verifyToken(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function requireAuth(handler) {
  return async (req, res) => {
    try {
      req.user = verifyToken(req);
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}

export function requireRole(role) {
  return (handler) => requireAuth(async (req, res) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return handler(req, res);
  });
}