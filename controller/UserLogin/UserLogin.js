// const bcrypt = require('bcrypt');
// const jwt = require("jsonwebtoken");
// const nodemailer = require('nodemailer');
// // const transporter = require("../config/nodemailer");
// const crypto = require('crypto');
// const SignUp = require('../../model/SignUp/SignUp');
// const Attendance = require('../../model/Attendance/Attendance');


// // ===============================
// // USER LOGIN — AUTO ATTENDANCE
// // ===============================
// const UserLogin = async (req, res) => {
//   try {
//     const { official_email, password } = req.body;

//     // Check user exists
//     const employee = await SignUp.findOne({ official_email, userType: "employee" });
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     // Match password
//     const isMatch = await bcrypt.compare(password, employee.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     // Mark attendance automatically
//     await markAttendanceCheckIn(employee._id);

//     // Create token
//     const token = jwt.sign(
//       { id: employee._id, role: employee.userType },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.status(200).json({
//       message: "Login successful",
//       token,
//       employeeId: employee._id,
//       ename: employee.ename,
//       official_email: employee.official_email,
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Login error", error: error.message });
//   }
// };


// // ===============================
// // USER LOGOUT — AUTO CHECKOUT
// // ===============================
// const UserLogout = async (req, res) => {
//   try {
//     const { employeeId } = req.body;

//     if (!employeeId) {
//       return res.status(400).json({ message: "Employee ID required" });
//     }

//     await markAttendanceCheckOut(employeeId);

//     res.status(200).json({ message: "Logout successful" });

//   } catch (error) {
//     res.status(500).json({ message: "Logout error", error: error.message });
//   }
// };


// // ===============================
// // HELPER — MARK CHECK-IN
// // ===============================
// async function markAttendanceCheckIn(empId) {
//   const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD string

//   // If already checked in, do not create again
//   let attendance = await Attendance.findOne({ empId, date: today });
//   if (attendance) return attendance.check_in;

//   const checkInTime = new Date().toLocaleTimeString("en-IN", { hour12: false });
//   const hour = Number(checkInTime.split(":")[0]);

//   // Half-Day logic
//   const status = hour >= 13 ? "Half Day" : "Present";

//   // Create attendance
//   attendance = await Attendance.create({
//     empId,
//     date: today,
//     check_in: checkInTime,
//     status
//   });

//   return checkInTime;
// }


// // ===============================
// // HELPER — MARK CHECK-OUT
// // ===============================
// async function markAttendanceCheckOut(empId) {
//   const today = new Date().toLocaleDateString("en-CA");

//   const attendance = await Attendance.findOne({ empId, date: today });

//   if (!attendance) return null; // user never logged in

//   // Only save first checkout
//   if (!attendance.check_out) {
//     const checkOutTime = new Date().toLocaleTimeString("en-IN", { hour12: false });

//     attendance.check_out = checkOutTime;
//     await attendance.save();

//     return checkOutTime;
//   }

//   return attendance.check_out; // already logged out
// }


// // ===============================
// // GET WORKING HOURS
// // ===============================
// const getWorkingHours = async (req, res) => {
//   try {
//     const { employeeId, date } = req.query;

//     if (!employeeId || !date) {
//       return res.status(400).json({ message: "Employee ID and date required" });
//     }

//     // Find record (date is stored as string => use same string)
//     const attendance = await Attendance.findOne({
//       empId: employeeId,
//       date: date
//     });

//     if (!attendance) {
//       return res.status(404).json({ message: "No attendance record found" });
//     }

//     // Calculate hours
//     let workingHours = 0;
//     if (attendance.check_in && attendance.check_out) {
//       const checkInTime = new Date(`${date} ${attendance.check_in}`);
//       const checkOutTime = new Date(`${date} ${attendance.check_out}`);
//       workingHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
//     }

//     res.status(200).json({
//       date: attendance.date,
//       check_in: attendance.check_in,
//       check_out: attendance.check_out,
//       workingHours: workingHours.toFixed(2),
//       status: attendance.status
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Error fetching working hours", error: error.message });
//   }
// };


// // ===============================
// // FORGOT PASSWORD (EMAIL SEND)
// // ===============================
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   }
// });

// // const forgotPassword = async (req, res) => {
// //   try {
// //     const { official_email } = req.body;

// //     const user = await SignUp.findOne({ official_email });
// //     if (!user) {
// //       return res.status(404).json({ message: "No user with that email found" });
// //     }

// //     const token = crypto.randomBytes(20).toString("hex");
// //     user.resetPasswordToken = token;
// //     user.resetPasswordExpires = Date.now() + 3600000;
// //     await user.save();

// //     const resetURL = `https://yourdomain.com/reset-password/${token}`;

// //     const mailOptions = {
// //       from: process.env.EMAIL_USER,
// //       to: user.official_email,
// //       subject: "Password Reset Request",
// //       text: `Reset your password here: ${resetURL}`
// //     };

// //     await transporter.sendMail(mailOptions);

// //     res.status(200).json({ message: "Password reset email sent" });

// //   } catch (error) {
// //     res.status(500).json({ message: "Error sending password reset email", error: error.message });
// //   }
// // };


// // ===============================
// // RESET PASSWORD
// // ===============================

// const forgotPassword = async (req, res) => {
//   try {
//     const { official_email } = req.body;

//     const user = await SignUp.findOne({ official_email });
//     if (!user) {
//       return res.status(404).json({ message: "No user with that email found" });
//     }

//     const token = crypto.randomBytes(20).toString("hex");

//     user.resetPasswordToken = token;
//     user.resetPasswordExpires = Date.now() + 3600000; // 1 hr
//     await user.save();

//     const resetURL = `http://localhost:3000/reset-password/${token}`;

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: user.official_email,
//       subject: "Password Reset Request",
//       html: `
//         <h2>Password Reset</h2>
//         <p>Click the link below to reset your password:</p>
//         <a href="${resetURL}" style="padding:10px 20px;background:#0066ff;color:#fff;text-decoration:none;border-radius:5px;">
//           Reset Password
//         </a>
//         <br/><br/>
//         <p>Or copy link: ${resetURL}</p>
//       `
//     };

//     await transporter.sendMail(mailOptions);

//     res.status(200).json({ message: "Password reset email sent" });

//   } catch (error) {
//     res.status(500).json({ message: "Error sending password reset email", error: error.message });
//   }
// };
// // const resetPassword = async (req, res) => {
// //   try {
// //     const { token } = req.params;
// //     const { password } = req.body;

// //     const user = await SignUp.findOne({
// //       resetPasswordToken: token,
// //       resetPasswordExpires: { $gt: Date.now() }  // token valid?
// //     });

// //     if (!user) {
// //       return res.status(400).json({ message: "Invalid or expired token" });
// //     }

// //     user.password = password;
// //     user.resetPasswordToken = undefined;
// //     user.resetPasswordExpires = undefined;

// //     await user.save();

// //     res.status(200).json({ message: "Password reset successful" });

// //   } catch (error) {
// //     res.status(500).json({ message: "Error resetting password", error: error.message });
// //   }
// // };





// const resetUserPassword = async (req, res) => {
//   try {
//     const { token, newPassword } = req.body;

//     const user = await SignUp.findOne({
//       resetPasswordToken: token,
//       resetPasswordExpires: { $gt: Date.now() }
//     });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid or expired token" });
//     }

//     user.password = await bcrypt.hash(newPassword, 10);
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;

//     await user.save();

//     res.status(200).json({ message: "Password has been reset" });

//   } catch (error) {
//     res.status(500).json({ message: "Password reset error", error: error.message });
//   }
// };


// module.exports = {
//   UserLogin,
//   UserLogout,
//   getWorkingHours,
//   forgotPassword,
//   resetUserPassword,
  

// };

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SignUp = require("../../model/SignUp/SignUp");
const Attendance = require("../../model/Attendance/Attendance");
const nodemailer = require("nodemailer");
const { markAttendanceCheckIn, markAttendanceCheckOut } = require("../Attendance/Attendance");
const crypto = require("crypto");

// Convert UTC → Indian time (YYYY-MM-DD and HH:mm:ss)
function getISTDate() {
  const dateIST = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
  });
  return new Date(dateIST);
}

function formatDate(date) {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function formatTime(date) {
  return date.toTimeString().split(" ")[0]; // HH:mm:ss
}

/* =====================================================
   EMPLOYEE LOGIN  → CHECK-IN ATTENDANCE
   ===================================================== */
// const UserLogin = async (req, res) => {
//   try {
//     const { official_email, password } = req.body;

//     const employee = await SignUp.findOne({ official_email });
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     const match = await bcrypt.compare(password, employee.password);
//     if (!match) {
//       return res.status(400).json({ message: "Invalid password" });
//     }

//     // Mark attendance
//     const { checkIn, status } = await markCheckIn(employee._id);

//     // Create Token
//     const token = jwt.sign(
//       { id: employee._id, role: employee.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.status(200).json({
//       message: "Login success",
//       token,
//       employeeId: employee._id,
//       ename: employee.ename,
//       official_email: employee.official_email,
//       check_in: checkIn,
//       status,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Login error", error: err.message });
//   }
// };

const UserLogin = async (req, res) => {
  try {
    const { official_email, password } = req.body;

    const employee = await SignUp.findOne({ official_email });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const match = await bcrypt.compare(password, employee.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // FIXED — correct function name
    const { checkIn, status } = await markAttendanceCheckIn(employee._id);

    const token = jwt.sign(
      { id: employee._id, role: employee.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login success",
      token,
      employeeId: employee._id,
      ename: employee.ename,
      official_email: employee.official_email,
      check_in: checkIn,
      status,
    });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
};

/* =====================================================
   EMPLOYEE LOGOUT → CHECK-OUT ATTENDANCE
   ===================================================== */
// const UserLogout = async (req, res) => {
//   try {
//     const { employeeId } = req.body;

//     await markCheckOut(employeeId);

//     res.status(200).json({ message: "Logout success" });
//   } catch (err) {
//     res.status(500).json({ message: "Logout error", error: err.message });
//   }
// };

const UserLogout = async (req, res) => {
  try {
    const { employeeId } = req.body;

    await markAttendanceCheckOut(employeeId); // FIXED

    res.status(200).json({ message: "Logout success" });
  } catch (err) {
    res.status(500).json({ message: "Logout error", error: err.message });
  }
};

/* =====================================================
   MARK CHECK-IN
   ===================================================== */

/* =====================================================
   MARK CHECK-OUT
   ===================================================== */



/* =====================================================
   CALCULATE WORKING HOURS
   ===================================================== */
function calculateWorkingHours(checkIn, checkOut, date) {
  const start = new Date(`${date} ${checkIn}`);
  const end = new Date(`${date} ${checkOut}`);
  let diff = (end - start) / (1000 * 60 * 60);
  return diff.toFixed(2);
}

/* =====================================================
   GET WORKING HOURS API
   ===================================================== */
const getWorkingHours = async (req, res) => {
  try {
    const { employeeId, date } = req.query;

    const attendance = await Attendance.findOne({
      empId: employeeId,
      date,
    });

    if (!attendance) {
      return res.status(404).json({ message: "No attendance found" });
    }

    res.json({
      date,
      check_in: attendance.check_in,
      check_out: attendance.check_out,
      workingHours: attendance.workingHours || "0",
      status: attendance.status,
    });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};

/* =====================================================
   FORGOT & RESET PASSWORD
   ===================================================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const forgotPassword = async (req, res) => {
  try {
    const { official_email } = req.body;

    const user = await SignUp.findOne({ official_email });
    if (!user) return res.status(404).json({ message: "Email not found" });

    const token = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const link = `http://localhost:3000/reset-password/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: official_email,
      subject: "Reset Password",
      html: `<a href="${link}">Reset Password</a>`,
    });

    res.json({ message: "Password reset link sent" });
  } catch (err) {
    res.status(500).json({ message: "Email error", error: err.message });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await SignUp.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid/expired token" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};

module.exports = {
  UserLogin,
  UserLogout,
  getWorkingHours,
  forgotPassword,
  resetUserPassword,
};
