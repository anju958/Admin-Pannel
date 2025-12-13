

  const bcrypt = require("bcrypt");
  const jwt = require("jsonwebtoken");
  const SignUp = require("../../model/SignUp/SignUp");
  const Attendance = require("../../model/Attendance/Attendance");
  const nodemailer = require("nodemailer");
  const { markAttendanceCheckIn, markAttendanceCheckOut } = require("../Attendance/Attendance");
  const crypto = require("crypto");
  const Holiday = require("../../model/Holiday/Holiday");

// IST helpers (you already had these, keeping same)
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
const UserLogin = async (req, res) => {
  try {
    const { official_email, password } = req.body;

    // 1) Find employee
    const employee = await SignUp.findOne({ official_email });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // 2) Check password
    const match = await bcrypt.compare(password, employee.password || "");
    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // 3) Generate token
    const token = jwt.sign(
      { id: employee._id, role: employee.role },
      process.env.JWT_SECRET || "TEMP_SECRET",
      { expiresIn: "1d" }
    );

    // 4) Attendance Logic
    let checkIn = null;
    let attendanceStatus = null;

    try {
      const now = getISTDate();
      const todayStr = formatDate(now);

      // ⭐ FIRST: Holiday Check
      const holiday = await Holiday.findOne({ date: new Date(todayStr) });
      if (holiday) {
        attendanceStatus = "holiday";
        return res.status(200).json({
          message: `Today is a holiday (${holiday.title}). Attendance not required.`,
          token,
          employeeId: employee._id,
          ename: employee.ename,
          official_email: employee.official_email,
          check_in: null,
          attendanceStatus: "holiday",
          isHoliday: true
        });
      }

      // ⭐ SECOND: Office hours logic
      const timeStr = formatTime(now).slice(0, 5); // "HH:mm"
      const officeStart = employee.officeStart || "09:30";
      const officeEnd = employee.officeEnd || "18:30";

      const isWithinOfficeTime = timeStr >= officeStart && timeStr <= officeEnd;

      if (!isWithinOfficeTime) {
        attendanceStatus = "not_marked_out_of_office_time";
      } else {
        // Check if already checked in
        const existing = await Attendance.findOne({
          empId: employee._id,
          date: new Date(todayStr)
        });

        if (existing && existing.check_in) {
          attendanceStatus = "already_marked";
          checkIn = `${todayStr}T${existing.check_in}`;
        } else {
          const result = await markAttendanceCheckIn(employee._id);
          checkIn = result?.checkIn || null;
          attendanceStatus = result?.status || "present";
        }
      }

    } catch (attErr) {
      console.error("Attendance check-in error during login:", attErr);
      attendanceStatus = "attendance_error";
      checkIn = null;
    }

    // 5) Return final response
    return res.status(200).json({
      message: "Login success",
      token,
      employeeId: employee._id,
      ename: employee.ename,
      official_email: employee.official_email,
      check_in: checkIn,
      attendanceStatus,
    });

  } catch (err) {
    console.error("UserLogin error:", err);
    return res.status(500).json({ message: "Login error", error: err.message });
  }
};

  /* =====================================================
    EMPLOYEE LOGOUT → CHECK-OUT ATTENDANCE
    ===================================================== */

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
      const { employeeId, date } = req.query; // date = "YYYY-MM-DD"

      const startOfDay = new Date(date);
      const attendance = await Attendance.findOne({
        empId: employeeId,
        date: startOfDay
      });

      if (!attendance || !attendance.check_in) {
        return res.json({ check_in: null });
      }

      res.json({
        check_in: `${date}T${attendance.check_in}`,   // "YYYY-MM-DDTHH:mm:ss"
        idleTime: attendance.idleMinutes || 0,
        officeStart: attendance.officeStart,
        officeEnd: attendance.officeEnd,
        dailyWorkingHours: attendance.dailyWorkingHours
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
