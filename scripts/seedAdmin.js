import bcryptjs from 'bcryptjs';
import Admin from '../models/Admin.js';

const seedAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminName = (process.env.ADMIN_NAME || 'Super Admin').trim();
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  if (!adminEmail || !adminPassword) {
    console.log('⚠️  Admin seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD is missing');
    return null;
  }

  const existingAdmin = await Admin.findOne({ email: adminEmail });
  if (existingAdmin) {
    console.log(`ℹ️  Admin already exists for ${adminEmail}`);
    return existingAdmin;
  }

  const admin = await Admin.create({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: 'superadmin',
    isActive: true,
  });

  console.log(`✅ Seed admin created for ${adminEmail}`);
  return admin;
};

export default seedAdmin;