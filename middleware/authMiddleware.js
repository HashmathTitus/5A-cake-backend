import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const getBearerToken = (authorizationHeader = '') => {
  if (!authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice(7).trim();
};

export const protect = async (req, res, next) => {
  const token = getBearerToken(req.headers.authorization || '');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({ success: false, message: 'JWT secret is not configured' });
    }

    const decoded = jwt.verify(token, secret);
    const admin = await Admin.findById(decoded.id).select('email role isActive name');

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'This admin account is disabled' });
    }

    req.admin = {
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      name: admin.name,
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.admin || !allowedRoles.includes(req.admin.role)) {
    return res.status(403).json({ success: false, message: 'You do not have permission to perform this action' });
  }

  return next();
};

export default protect;
