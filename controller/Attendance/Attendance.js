const Attendance = require('../../model/Attendance/Attendance');
const SignUp = require('../../model/SignUp/SignUp');

//helper function
function toMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function isSunday(date) {
  return new Date(date).getDay() === 0; // 0 = Sunday
}



// ========================
// GET MONTHLY ATTENDANCE
// ========================

function generateStringDates(year, month) {
  const arr = [];
  const monthIndex = Number(month) - 1;
  const days = new Date(year, monthIndex + 1, 0).getDate();

  for (let i = 1; i <= days; i++) {
    const d = i.toString().padStart(2, '0');
    const m = month.toString().padStart(2, '0');
    arr.push(`${year}-${m}-${d}`);
  }
  return arr;
}

const getMonthlyAttendance = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;

    if (!employeeId || !month || !year) {
      return res.status(400).json({ error: "Missing employeeId, month or year" });
    }

    const monthIndex = Number(month) - 1;
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59);

    // Fetch ALL raw attendance
    const rawData = await Attendance.find({
      empId: employeeId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // ===============================================
    // ⭐ MERGE MULTIPLE ENTRIES PER DAY (MAIN FIX)
    // ===============================================
    const merged = {};

    rawData.forEach((att) => {
      const dateKey = att.date.toISOString().split("T")[0];

      if (!merged[dateKey]) {
        merged[dateKey] = {
          date: att.date,
          check_in: att.check_in || null,
          check_out: att.check_out || null,
          status: att.status
        };
      } else {
        // Merge logic: earliest IN & latest OUT
        if (att.check_in) {
          const prevIn = merged[dateKey].check_in;
          if (!prevIn || att.check_in < prevIn) {
            merged[dateKey].check_in = att.check_in;
          }
        }

        if (att.check_out) {
          const prevOut = merged[dateKey].check_out;
          if (!prevOut || att.check_out > prevOut) {
            merged[dateKey].check_out = att.check_out;
          }
        }
      }
    });

    // Convert merged object → array
    const data = Object.values(merged);

    // =====================================================
    // ===============   SUMMARY CALCULATION  ===============
    // =====================================================

    let present = 0, absent = 0, leave = 0, holiday = 0, halfday = 0;
    let lateCount = 0, lateHours = 0;

    const officeMin = toMinutes("09:30");
    const graceMin = toMinutes("09:40");

    data.forEach((att) => {
      const dateStr = att.date.toISOString().split("T")[0];

      // Auto Sunday holiday
      if (isSunday(att.date)) {
        holiday++;
        return;
      }

      // Leave
      if (att.status.toLowerCase() === "leave") {
        leave++;
        return;
      }

      // Absent
      if (!att.check_in) {
        absent++;
        return;
      }

      // Present / Half Day
      if (att.status === "Half Day") halfday++;
      else present++;

      // LATE LOGIC
      const checkMin = toMinutes(att.check_in);

      if (checkMin > graceMin) {
        lateCount++;

        if (checkMin > officeMin + 30) {
          lateHours += 1.5;
        }
      }

      // Working hours
      if (!att.check_out) att.check_out = att.check_in;

      const start = new Date(`${dateStr} ${att.check_in}`);
      const end = new Date(`${dateStr} ${att.check_out}`);
      const hours = (end - start) / (1000 * 60 * 60);

      if (hours < 2) {
        absent++;
      } else if (hours < 4) {
        halfday++;
      }
    });

    // =====================================================
    // ===============  LATE DEDUCTION RULE  ===============
    // =====================================================

    let deduction = Math.floor(lateCount / 5);
    const remainingLate = lateCount % 5;

    if (remainingLate >= 3) deduction++;

    return res.json({
      data,
      summary: {
        present,
        absent,
        leave,
        holiday,
        halfday,
        lateCount,
        lateHours,
        deduction
      }
    });

  } catch (err) {
    console.error("Attendance fetch error:", err);
    res.status(500).json({ error: "Failed to fetch monthly attendance" });
  }
};




const getTodayAttendance = async (req, res) => {
  try {
    const { employeeId } = req.query;

    const employee = await SignUp.findById(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const today = new Date().toLocaleDateString("en-CA");

    const data = await Attendance.findOne({
      empId: employeeId,
      date: today
    });

    res.json(data || {});

  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    res.status(500).json({ error: "Error fetching today's attendance" });
  }
};

// ========================
// LOGOUT + CHECK-OUT
// ========================
const logoutEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ message: "employeeId missing" });
    }

    const employee = await SignUp.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const today = new Date().toLocaleDateString("en-CA");

    const att = await Attendance.findOne({ empId: employeeId, date: today });

    if (!att) {
      return res.status(400).json({ message: "No check-in found today" });
    }

    const checkOutTime = new Date().toLocaleTimeString("en-IN", { hour12: false });

    const start = new Date(`${today} ${att.check_in}`);
    const end = new Date(`${today} ${checkOutTime}`);
    const workingHours = ((end - start) / (1000 * 60 * 60)).toFixed(2);

    att.check_out = checkOutTime;
    att.workingHours = workingHours;
    await att.save();

    res.status(200).json({
      message: "Logout successful",
      check_out: checkOutTime,
      workingHours
    });

  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
};

// ========================
// CHECKOUT HELPER
// ========================
async function markAttendanceCheckOut(empId) {
  const today = new Date().toLocaleDateString("en-CA");

  const attendance = await Attendance.findOne({ empId, date: today });

  if (attendance && !attendance.check_out) {
    attendance.check_out = new Date().toLocaleTimeString("en-IN", { hour12: false });
    await attendance.save();
  }
}

module.exports = { 
  getMonthlyAttendance,
  getTodayAttendance,
  logoutEmployee,
  markAttendanceCheckOut 
};
