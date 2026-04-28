import bcryptjs from 'bcryptjs';
import Admin from '../models/Admin.js';

const seedAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
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

  const hashedPassword = await bcryptjs.hash(adminPassword, 10);

  await Admin.insertMany([
    {
      name: '5A Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    },
  ]);

  console.log(`✅ Seed admin created for ${adminEmail}`);
  return Admin.findOne({ email: adminEmail });
};

export default seedAdmin;