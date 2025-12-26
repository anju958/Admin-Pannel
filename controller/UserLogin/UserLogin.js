

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SignUp = require("../../model/SignUp/SignUp");
const Attendance = require("../../model/Attendance/Attendance");
const nodemailer = require("nodemailer");
const { markAttendanceCheckIn, markAttendanceCheckOut } = require("../Attendance/Attendance");
const crypto = require("crypto");
const Holiday = require("../../model/Holiday/Holiday");
const Leave = require('../../model/userPannel/Leaves/Leaves')

const TIME_ZONE = "Asia/Kolkata";
const DEFAULT_OFFICE_START = "09:30";
const DEFAULT_OFFICE_END = "18:30";
const DEFAULT_GRACE_MINUTES = 10;
const ABSENT_CUTOFF_TIME = "12:00"; // after this → Absent

/* ================= TIME HELPERS ================= */
function getISTDate() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TIME_ZONE }));
}

function formatDateIST(d) {
  return new Date(d).toLocaleDateString("en-CA", { timeZone: TIME_ZONE }); // YYYY-MM-DD
}

function formatTime(d) {
  return new Date(d).toLocaleTimeString("en-IN", {
    hour12: false,
    timeZone: TIME_ZONE,
  }).slice(0, 5); // HH:mm
}

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function parseISTMidnight(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0) - 5.5 * 60 * 60 * 1000);
}

function sendLoginResponse(res, emp, token, extra = {}) {
  return res.status(200).json({
    message: "Login success",
    token,
    employeeId: emp._id,
    ename: emp.ename,
    official_email: emp.official_email,
    role: emp.role,
    ...extra,
  });
}

const UserLogin = async (req, res) => {
  try {
    const { official_email, password } = req.body;

    /* 1️⃣ AUTH */
    const emp = await SignUp.findOne({ official_email });
    if (!emp) return res.status(404).json({ message: "Employee not found" });

    const ok = await bcrypt.compare(password, emp.password || "");
    if (!ok) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: emp._id, role: emp.role },
      process.env.JWT_SECRET || "TEMP_SECRET",
      { expiresIn: "1d" }
    );

    /* 2️⃣ DATE / TIME (IST) */
    const now = req.body.testDateTime
      ? new Date(req.body.testDateTime)
      : getISTDate();

    const dateKey = formatDateIST(now);
    const todayMidnight = parseISTMidnight(dateKey);
    const timeStr = formatTime(now); // HH:mm

    /* 3️⃣ SUNDAY */
    if (now.getDay() === 0) {
      await Attendance.findOneAndUpdate(
        { empId: emp._id, date: todayMidnight },
        {
          empId: emp._id,
          date: todayMidnight,
          status: "Holiday",
          remark: "Sunday",
        },
        { upsert: true }
      );

      return sendLoginResponse(res, emp, token, {
        attendanceStatus: "Holiday (Sunday)",
      });
    }

    /* 4️⃣ FESTIVAL HOLIDAY */
    const holiday = await Holiday.findOne({
      date: {
        $gte: todayMidnight,
        $lt: new Date(todayMidnight.getTime() + 86400000),
      },
    });

    if (holiday) {
      await Attendance.findOneAndUpdate(
        { empId: emp._id, date: todayMidnight },
        {
          empId: emp._id,
          date: todayMidnight,
          status: "Holiday",
          remark: holiday.title,
        },
        { upsert: true }
      );

      return sendLoginResponse(res, emp, token, {
        attendanceStatus: "Holiday",
      });
    }

    /* 5️⃣ APPROVED LEAVE */
    const leave = await Leave.findOne({
      employeeId: emp._id,
      status: "Approved",
      from_date: { $lte: todayMidnight },
      to_date: { $gte: todayMidnight },
    });

    /* 6️⃣ EXISTING ATTENDANCE (PREVENT DOUBLE LOGIN) */
    const existing = await Attendance.findOne({
      empId: emp._id,
      date: todayMidnight,
    });

    if (existing) {
      // ❗ IMPORTANT: Do NOT change check_in, status, lateMinutes
      return sendLoginResponse(res, emp, token, {
        attendanceStatus: existing.status,
        check_in: existing.check_in,
        lateMinutes: existing.isLateMinutes || 0,
        message: "Attendance already marked for today",
      });
    }
    /* 7️⃣ OFFICE CONFIG (ADMIN OVERRIDABLE) */
    const officeStart = emp.officeStart || DEFAULT_OFFICE_START;
    const officeEnd = emp.officeEnd || DEFAULT_OFFICE_END;
    const graceMinutes =
      typeof emp.graceMinutes === "number"
        ? emp.graceMinutes
        : DEFAULT_GRACE_MINUTES;

    /* 8️⃣ TIME CALCULATIONS */
    const loginMinutes = toMinutes(timeStr);
    const officeStartMinutes = toMinutes(officeStart);
    const graceEndMinutes = officeStartMinutes + graceMinutes;
    const absentCutoffMinutes = toMinutes(ABSENT_CUTOFF_TIME);

    let status = "Present";
    let lateMinutes = 0;

    /* 9️⃣ LEAVE LOGIC FIRST */
    if (leave) {
      if (leave.isHalfDay) {
        status = "Half Day";
      } else {
        status = leave.paid ? "Paid Leave" : "Unpaid Leave";
      }
    }

    /* 🔟 NO LEAVE → APPLY TIME RULES */
    else {
      if (loginMinutes <= graceEndMinutes) {
        status = "Present";
      } else if (
        loginMinutes > graceEndMinutes &&
        loginMinutes <= absentCutoffMinutes
      ) {
        status = "Present";
        lateMinutes = loginMinutes - graceEndMinutes;
      } else {
        status = "Absent";
      }
    }

    /* 1️⃣1️⃣ SAVE ATTENDANCE */
    await Attendance.create({
      empId: emp._id,
      date: todayMidnight,
      check_in: timeStr,
      status,
      isLateMinutes: lateMinutes,
      officeStart,
      officeEnd,
      graceMinutes,
      dailyWorkingHours: emp.dailyWorkingHours,
    });

    /* 1️⃣2️⃣ FINAL RESPONSE */
    return sendLoginResponse(res, emp, token, {
      attendanceStatus: status,
      lateMinutes,
      check_in: timeStr,
    });

  } catch (err) {
    console.error("UserLogin error:", err);
    return res.status(500).json({
      message: "Login error",
      error: err.message,
    });
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
