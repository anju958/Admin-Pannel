require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Update this path to your actual user model file
const User = require("../model/Users/Users"); // or "../models/User"

// Full permissions object as needed
const FULL_PERMISSIONS = {
  "Home": ["View"],
  "Job Opening": ["View", "Add", "Edit", "Delete"],
  "Departments": ["View", "Add", "Edit", "Delete"],
  "Employees": ["View", "Add", "Edit", "Delete"],
  "Intern": ["View", "Add", "Edit", "Delete"],
  "Attendance": ["View", "Add", "Edit", "Delete"],
  "Leads": ["View", "Add", "Edit", "Delete"],
  "Clients": ["View", "Add", "Edit", "Delete"],
  "Proposals": ["View", "Add", "Edit", "Delete"],
  "Invoices": ["View", "Add", "Edit", "Delete"],
  "Reports": ["View", "Add", "Edit", "Delete"],
  "Projects": ["View", "Add", "Edit", "Delete"],
  "UserManagement": ["View", "Add", "Edit", "Delete"],
  "Complaints": ["View", "Add", "Edit", "Delete"],
  "Notice Board": ["View", "Add", "Edit", "Delete"],
  "Company Details": ["View", "Add", "Edit", "Delete"]
};

async function seedSuperAdmin() {
  const mongoURL = process.env.MONGO_URL;
  if (!mongoURL) {
    throw new Error("❌ MONGO_URL not found in .env file");
  }
  await mongoose.connect(mongoURL);

  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  // Use updateOne so pre-save hook DOES NOT re-hash!
  await User.updateOne(
    { role: "superadmin", email: "admin@gmail.com" },
    {
      $set: {
        name: "Super Admin",
        password: hashedPassword,
        permissions: FULL_PERMISSIONS,
        role: "superadmin"
      }
    },
    { upsert: true }
  );

  console.log("✅ Super admin permissions and password updated (or created)!");
  await mongoose.disconnect();
}

seedSuperAdmin().catch((err) => {
  console.error("❌ Error:", err);
  mongoose.disconnect();
});
