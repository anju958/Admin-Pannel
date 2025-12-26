
const Attendance = require('../../model/Attendance/Attendance');
const SignUp = require('../../model/SignUp/SignUp');
const Leave = require('../../model/userPannel/Leaves/Leaves');
const Holiday = require("../../model/Holiday/Holiday");
const mongoose = require('mongoose');


/* ---------------------------
   markAttendanceCheckOut
----------------------------*/
const markAttendanceCheckOut = async (req, res) => {
  const emp = await SignUp.findById(req.body.employeeId);
  if (!emp) return res.status(404).json({ message: "Employee not found" });

  const now = new Date();
  const dateKey = now.toISOString().split("T")[0];

  // ⭐ RULE 0: Prevent checkout on holiday
  const holiday = await Holiday.findOne({ date: new Date(dateKey) });
  if (holiday) {
    return res.status(400).json({
      message: `Checkout not allowed — Today is a holiday (${holiday.title}).`,
      isHoliday: true
    });
  }

  const attendance = await Attendance.findOne({
    empId: emp._id,
    date: dateKey,
  });

  // RULE 3: Must check-in first
  if (!attendance || !attendance.check_in) {
    return res.status(400).json({ message: "You haven't checked in today" });
  }

  attendance.check_out = now.toTimeString().slice(0, 8);

  await attendance.save();

  res.json({
    message: "Checkout successful",
    attendance,
  });
};



const TIME_ZONE = "Asia/Kolkata";

/* ---------------------------
   getTodayAttendance
----------------------------*/
const getTodayAttendance = async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) return res.status(400).json({ message: 'employeeId required' });

    const nowKey = formatDateIST(new Date());
    const start = parseISTLocalToUTC(nowKey, '00:00:00');
    const end = parseISTLocalToUTC(nowKey, '23:59:59');

    const att = await Attendance.findOne({
      empId: employeeId,
      date: { $gte: start, $lte: end }
    }).lean();

    return res.json(att || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ---------------------------
   getMonthlyAttendance (per employee)
----------------------------*/
async function buildLeaveMapForEmployee(employeeId, start, end) {
  const leaves = await Leave.find({
    employeeId,
    status: "Approved",
    from_date: { $lte: end },
    to_date: { $gte: start },
  }).lean();

  const leaveMap = {};

  for (const lv of leaves) {
    let from = lv.from_date < start ? new Date(start) : new Date(lv.from_date);
    let to = lv.to_date > end ? new Date(end) : new Date(lv.to_date);

    for (let dt = new Date(from); dt <= to; dt.setDate(dt.getDate() + 1)) {
      const key = formatDateIST(dt);

      leaveMap[key] = {
        paid: !!lv.paid,
        isHalfDay: !!lv.isHalfDay,
        leave_type: lv.leave_type || "",
      };
    }
  }

  return leaveMap;
}

async function buildHolidaySet(start, end) {
  const holidays = await Holiday.find({
    date: { $gte: start, $lte: end },
  }).lean();

  const holidaySet = new Set();

  for (const h of holidays) {
    const key = formatDateIST(h.date);
    holidaySet.add(key);
  }

  return holidaySet;
}

function getMonthRange(month, year) {
  const m = Number(month);
  const y = Number(year);

  if (isNaN(m) || isNaN(y)) {
    throw new Error("Invalid month or year");
  }

  const startDate = new Date(y, m - 1, 1, 0, 0, 0);
  const endDate = new Date(y, m, 0, 23, 59, 59);

  return { startDate, endDate };
}

function datesArray(year, month) {
  const dates = [];
  const y = Number(year);
  const m = Number(month);

  const totalDays = new Date(y, m, 0).getDate();

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(
      new Date(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00`)
        .toLocaleString("en-US", { timeZone: TIME_ZONE })
    );

    dates.push(formatDateIST(date)); // YYYY-MM-DD
  }

  return dates;
}
function formatDateIST(date) {
  return new Date(date).toLocaleDateString("en-CA", {
    timeZone: TIME_ZONE,
  });
}
const getMonthlyAttendance = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;

    if (!employeeId || !month || !year)
      return res.status(400).json({ error: "Missing employeeId, month or year" });

    const emp = await SignUp.findById(employeeId).lean();
    if (!emp) return res.status(404).json({ error: "Employee not found" });

    // ✅ FIX #1: correct order (month, year)
    // ✅ FIX #2: correct destructuring names
    const { startDate, endDate } = getMonthRange(Number(month), Number(year));

    const dateKeys = datesArray(Number(year), Number(month));
    const todayKey = formatDateIST(new Date());

    const [attendanceRecords, leaveMap, holidaySet] = await Promise.all([
      Attendance.find({
        empId: employeeId,
        date: { $gte: startDate, $lte: endDate },
      }).lean(),

      buildLeaveMapForEmployee(employeeId, startDate, endDate),
      buildHolidaySet(startDate, endDate),
    ]);

    let recordMap = {};
    attendanceRecords.forEach((r) => {
      const key = formatDateIST(r.date);
      recordMap[key] = r;
    });

    let output = [];
    let summary = {
      present: 0,
      absent: 0,
      halfday: 0,
      holiday: 0,
      paidLeaves: 0,
      unpaidLeaves: 0,
      lateCount: 0,
      lateHours: 0,
      totalDeduction: 0,
    };

    for (const key of dateKeys) {
      const weekday = new Date(
        new Date(`${key}T00:00:00Z`).toLocaleString("en-US", { timeZone: TIME_ZONE })
      ).getDay();

      let row = {
        date: key,
        status: "-",
        check_in: null,
        check_out: null,
        workingHours: 0,
        isLateMinutes: 0,
      };

      if (key > todayKey) {
        output.push(row);
        continue;
      }

      const isSunday = weekday === 0;
      const isHoliday = holidaySet.has(key);
      const att = recordMap[key];
      const leaveInfo = leaveMap[key];

      if (isSunday || isHoliday) {
        row.status = "Holiday";
        summary.holiday++;
        output.push(row);
        continue;
      }

      if (att) {
        row.status = att.status || "-";
        row.check_in = att.check_in;
        row.check_out = att.check_out;
        row.workingHours = att.workingHours || 0;
        row.isLateMinutes = att.isLateMinutes || 0;

        const s = row.status.toLowerCase();
        if (s === "present") summary.present++;
        else if (s === "absent") summary.absent++;
        else if (s.includes("half")) summary.halfday++;
        else if (s.includes("paid")) summary.paidLeaves++;
        else if (s.includes("unpaid")) summary.unpaidLeaves++;

        if (row.isLateMinutes > 0) {
          summary.lateCount++;
          summary.lateHours += row.isLateMinutes / 60;
        }
      } else if (leaveInfo) {
        if (leaveInfo.isHalfDay) {
          row.status = "Half Day Leave";
          summary.halfday++;
        } else {
          row.status = leaveInfo.paid ? "Paid Leave" : "Unpaid Leave";
          leaveInfo.paid ? summary.paidLeaves++ : summary.unpaidLeaves++;
        }
      } else {
        row.status = "Absent";
        summary.absent++;
      }

      output.push(row);
    }

    summary.lateHours = Number(summary.lateHours.toFixed(2));
    summary.totalDeduction = Number(summary.totalDeduction.toFixed(2));

    res.json({ data: output, summary });

  } catch (err) {
    console.error("getMonthlyAttendance error:", err);
    res.status(500).json({ error: err.message });
  }
};


/* ---------------------------
   getMonthlyAttendanceByAdmin
----------------------------*/
// ADMIN – MONTHLY ATTENDANCE (MULTI EMPLOYEE)
const getMonthlyAttendanceByAdmin = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: "Missing month or year" });
    }

    const monthInt = Number(month);
    const yearInt = Number(year);

    const { start, end } = getMonthRange(yearInt, monthInt);
    const dateKeys = datesArray(yearInt, monthInt); // ["2025-12-01", "2025-12-02", ...]

    const todayKey = formatDateIST(new Date());

    // 1️⃣ Get employees
    const employees = await SignUp.find().lean();

    // 2️⃣ Fetch all attendance + holidays + leaves for month
    const [attendanceRecords, holidays] = await Promise.all([
      Attendance.find({ date: { $gte: start, $lte: end } }).lean(),
      Holiday.find({ date: { $gte: start, $lte: end } }).lean()
    ]);

    // Create holiday set
    const holidaySet = new Set(
      holidays.map((h) => formatDateIST(h.date))
    );

    // Group attendance by employee
    const attendanceMap = {};
    attendanceRecords.forEach(a => {
      const key = formatDateIST(a.date);
      if (!attendanceMap[a.empId]) attendanceMap[a.empId] = {};
      attendanceMap[a.empId][key] = a;
    });

    let finalResult = [];

    for (let emp of employees) {
      let output = [];
      let summary = {
        present: 0,
        absent: 0,
        halfday: 0,
        holiday: 0,
        paidLeaves: 0,
        unpaidLeaves: 0,
        lateCount: 0,
        lateHours: 0,
      };

      for (const key of dateKeys) {
        const weekday = new Date(
          new Date(`${key}T00:00:00Z`).toLocaleString("en-US", { timeZone: TIME_ZONE })
        ).getDay();

        let row = {
          date: key,
          status: "-",
          check_in: null,
          check_out: null,
          workingHours: 0,
          isLateMinutes: 0
        };

        // FUTURE DATE
        if (key > todayKey) {
          output.push(row);
          continue;
        }

        // JOINING DATE CHECK (if exists)
        if (emp.joiningDate) {
          const joinKey = formatDateIST(emp.joiningDate);
          if (key < joinKey) {
            output.push(row); // before joining → "-"
            continue;
          }
        }

        const isSunday = weekday === 0;
        const isHoliday = holidaySet.has(key);

        const att = attendanceMap[emp._id]?.[key];

        // SUNDAY / HOLIDAY
        if (isSunday || isHoliday) {
          row.status = "Holiday";
          summary.holiday++;
          output.push(row);
          continue;
        }

        // ATTENDANCE EXISTS
        if (att) {
          row.status = att.status;
          row.check_in = att.check_in;
          row.check_out = att.check_out;
          row.workingHours = att.workingHours;
          row.isLateMinutes = att.isLateMinutes;

          const s = (att.status || '').toLowerCase();
          if (s === "present") summary.present++;
          else if (s === "absent") summary.absent++;
          else if (s === "half day") summary.halfday++;
          else if (s === "paid leave") summary.paidLeaves++;
          else if (s === "unpaid leave") summary.unpaidLeaves++;

          if (att.isLateMinutes > 0) {
            summary.lateCount++;
            summary.lateHours += att.isLateMinutes / 60;
          }

        } else {
          // PAST DATE, NO ATTENDANCE → ABSENT
          row.status = "Absent";
          summary.absent++;
        }

        output.push(row);
      }

      summary.lateHours = Number(summary.lateHours.toFixed(2));

      finalResult.push({
        empId: emp._id,
        ename: emp.ename,
        officeStart: emp.officeStart,
        officeEnd: emp.officeEnd,
        graceMinutes: emp.graceMinutes,
        dailyWorkingHours: emp.dailyWorkingHours,
        summary,
        attendance: output,
      });
    }

    res.json(finalResult);

  } catch (err) {
    console.error("Admin monthly attendance error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


/* ---------------------------
   Admin update one employee office timing
----------------------------*/
async function adminUpdateOfficeTiming(req, res) {
  try {
    const { employeeId } = req.params;
    const { officeStart, officeEnd, graceMinutes, dailyWorkingHours } = req.body;

    const emp = await SignUp.findById(employeeId);
    if (!emp) return res.status(404).json({ message: "Employee not found" });

    await SignUp.updateOne(
      { _id: employeeId },
      {
        $set: {
          officeStart,
          officeEnd,
          graceMinutes,
          dailyWorkingHours
        }
      }
    );

    return res.json({ message: "Office timing updated", employeeId });

  } catch (err) {
    console.error("adminUpdateOfficeTiming error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  getMonthlyAttendanceByAdmin,
 
  markAttendanceCheckOut,
  getTodayAttendance,
  getMonthlyAttendance,
  adminUpdateOfficeTiming,
};
