import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';

const generateToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    }
  );
};

const buildAdminResponse = (admin) => ({
  id: admin._id.toString(),
  name: admin.name,
  email: admin.email,
  role: admin.role,
  isActive: admin.isActive,
});

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const requireJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
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
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'This admin account is disabled' });
    }

    // Check password
    const isPasswordValid = await admin.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = generateToken(admin);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: buildAdminResponse(admin),
      },
      token,
      admin: buildAdminResponse(admin),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('email role name isActive lastLoginAt');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.json({
      success: true,
      data: buildAdminResponse(admin),
      admin: buildAdminResponse(admin),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { login, getProfile };
