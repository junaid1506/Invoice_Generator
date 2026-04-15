import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export function authRequired(req, res, next) {
  const h = req.headers.authorization;
  const token = h?.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export async function attachUser(req, res, next) {
  if (!req.userId) return next();
  try {
    const user = await User.findById(req.userId).select('-password').lean();
    req.user = user;
  } catch {
    req.user = null;
  }
  next();
}

export function adminOnly(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}
