const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

mongoose.connect(process.env.MONGO_URL);

User.updateOne(
  { email: "admin@gmail.com" },
  {
    $set: {
      name: "Super Admin",
      role: "superadmin",
      password: bcrypt.hashSync("Admin@123", 10),
      permissions: {} // ignored for superadmin
    }
  },
  { upsert: true }
).then(() => {
  console.log("SuperAdmin ready");
  mongoose.disconnect();
});
