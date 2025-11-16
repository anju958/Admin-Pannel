const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const SignUp = require('../../model/SignUp/SignUp');
const Attendance = require('../../model/Attendance/Attendance'); // Your attendance schema

// LOGIN CONTROLLER
const UserLogin = async (req, res) => {
  try {
    const { official_email, password } = req.body;

    // Find employee
    const employee = await SignUp.findOne({ official_email, userType: "employee" });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Mark attendance on login
    await markAttendanceCheckIn(employee._id);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: employee._id,
        role: employee.userType
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Employee login successful",
      token,
      employeeId: employee._id,
      ename: employee.ename,
      official_email: employee.official_email,
    });
  } catch (error) {
    res.status(500).json({ message: "Login error", error: error.message });
  }
};

// LOGOUT CONTROLLER
const UserLogout = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID required" });
    }

    // Mark check-out time
    await markAttendanceCheckOut(employeeId);

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Logout error", error: error.message });
  }
};



// HELPER: Mark check-in on login
async function markAttendanceCheckIn(empId) {
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

  // Check if attendance exists
  let attendance = await Attendance.findOne({ empId, date: today });

  if (!attendance) {
    const checkInTime = new Date().toLocaleTimeString("en-IN", { hour12: false });

    attendance = await Attendance.create({
      empId,
      date: today,
      check_in: checkInTime,
      status: "Present"
    });

    return checkInTime; // Return the newly created check-in time
  }

  // If attendance already exists → return stored check-in
  return attendance.check_in;
}


// HELPER: Mark check-out on logout
async function markAttendanceCheckOut(empId) {
  const today = new Date().toLocaleDateString("en-CA");

  const attendance = await Attendance.findOne({ empId, date: today });

  if (attendance && !attendance.check_out) {
    const checkOutTime = new Date().toLocaleTimeString("en-IN", { hour12: false });

    attendance.check_out = checkOutTime;
    await attendance.save();

    return checkOutTime;
  }

  return attendance?.check_out; // Return existing checkout if any
}

// GET WORKING HOURS
const getWorkingHours = async (req, res) => {
  try {
    const { employeeId, date } = req.query;

    if (!employeeId || !date) {
      return res.status(400).json({ message: "Employee ID and date required" });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      empId: employeeId,
      date: targetDate
    });

    if (!attendance) {
      return res.status(404).json({ message: "No attendance record found" });
    }

    // Calculate working hours
    let workingHours = 0;
    if (attendance.check_in && attendance.check_out) {
      const checkInTime = new Date(`${date} ${attendance.check_in}`);
      const checkOutTime = new Date(`${date} ${attendance.check_out}`);
      workingHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert to hours
    }

    res.status(200).json({
      date: attendance.date,
      check_in: attendance.check_in,
      check_out: attendance.check_out,
      workingHours: workingHours.toFixed(2),
      status: attendance.status
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching working hours", error: error.message });
  }
};
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,  // Your email password or app password
  }
});

const forgotPassword = async (req, res) => {
  try {
    const { official_email } = req.body;
    const user = await SignUp.findOne({ official_email });
    if (!user) {
      return res.status(404).json({ message: "No user with that email found" });
    }

    // Create token
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry
    await user.save();

    // Construct reset URL
    const resetURL = `https://yourdomain.com/reset-password/${token}`; // Change to your frontend reset password URL

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.official_email,
      subject: "Password Reset Request",
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
Please click on the following link, or paste it into your browser to complete the process:\n\n
${resetURL}\n\n
If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Password reset email sent"
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Error sending password reset email", error: error.message });
  }
};
const resetUserPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  const user = await SignUp.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: "Password has been reset" });
};

module.exports = { UserLogin, UserLogout, getWorkingHours, resetUserPassword, forgotPassword };
