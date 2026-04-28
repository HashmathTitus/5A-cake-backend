import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';

const generateToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    },
    process.env.JWT_SECRET,
    {
    expiresIn: '7d',
    }
  );
};

const buildAdminResponse = (admin) => ({
  id: admin._id.toString(),
  email: admin.email,
  role: admin.role,
});

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const requireJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    requireJwtSecret();

    // Check if admin already exists
    const normalizedEmail = normalizeEmail(email);
    const existingAdmin = await Admin.findOne({ email: normalizedEmail });
    if (existingAdmin) {
      return res.status(409).json({ error: 'Admin with this email already exists' });
    }

    // Create new admin
    const admin = await Admin.create({ name, email: normalizedEmail, password });

    const token = generateToken(admin);
    res.status(201).json({
      token,
      admin: buildAdminResponse(admin),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    requireJwtSecret();

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if admin exists and select password field
    const admin = await Admin.findOne({ email: normalizeEmail(email) }).select('+password');
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ error: 'This admin account is disabled' });
    }

    // Check password
    const isPasswordValid = await admin.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(admin);
    res.status(200).json({
      token,
      admin: buildAdminResponse(admin),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('email role name isActive');
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json({
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      name: admin.name,
      isActive: admin.isActive,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { register, login, getProfile };
