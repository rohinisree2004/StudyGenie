import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studygenie';
    console.log(`[Seed Admin] Connecting to database...`);
    await mongoose.connect(mongoUri);

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@studygenie.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@StudyGenie2026!';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    // Check if an admin already exists
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log(`[Seed Admin] Admin already exists with email: ${adminEmail}`);
      admin.name = adminName;
      admin.role = 'admin';
      admin.accountStatus = 'active';
      admin.password = adminPassword; // Pre-save hook will hash it
      await admin.save();
      console.log(`[Seed Admin] Admin credentials updated successfully!`);
    } else {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        accountStatus: 'active',
        bio: 'Lead System Administrator for StudyGenie',
      });
      console.log(`[Seed Admin] Created default Admin successfully!`);
    }

    console.log(`\n=========================================`);
    console.log(`  StudyGenie Admin Provisioned:`);
    console.log(`  Email:    ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log(`  Role:     admin`);
    console.log(`=========================================\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Admin Error]: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
