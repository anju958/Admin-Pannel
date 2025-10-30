require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ✅ Use correct path (check if your folder is "models" or "model")
const User = require("../model/Users/Users"); // or "../models/User" if that's the folder name

async function seedSuperAdmin() {
  const mongoURL = process.env.MONGO_URL;
  if (!mongoURL) {
    throw new Error("❌ MONGO_URL not found in .env file");
  }

  // ✅ Connect to MongoDB
  await mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("✅ Connected to MongoDB");

  // ✅ Check if super admin already exists
  const existing = await User.findOne({ role: "superadmin" });
  if (existing) {
    console.log("⚠️ Super admin already exists!");
    await mongoose.disconnect();
    return;
  }

  // ✅ Create new super admin
  const hashedPassword = await bcrypt.hash("Admin@123", 10);
  const superAdmin = new User({
    name: "Super Admin",
    email: "admin@example.com",
    password: hashedPassword,
    role: "superadmin",
  });

  await superAdmin.save();
  console.log("🎉 Super admin created successfully!");
  await mongoose.disconnect();
}

// Run the function
seedSuperAdmin().catch((err) => {
  console.error("❌ Error:", err);
  mongoose.disconnect();
});
