
const Attendance = require('../../model/Attendance/Attendance');
const SignUp = require('../../model/SignUp/SignUp');
const Leave = require('../../model/userPannel/Leaves/Leaves');
const Holiday = require("../../model/Holiday/Holiday");
const mongoose = require('mongoose');

/**
 * CONFIG
 */
const TIME_ZONE = 'Asia/Kolkata';
const DEFAULT_OFFICE_START = '09:30';   // 9:30 AM
const DEFAULT_OFFICE_END = '18:30';     // 6:30 PM (24-hr format)
const DEFAULT_GRACE = 10;               // 10 min grace

function normalizeDate(d) {
  const dt = new Date(d);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

/* ---------------------------
   Time helpers (IST-aware)
----------------------------*/
function getISTDate() {
  const dateIST = new Date().toLocaleString("en-US", { timeZone: TIME_ZONE });
  return new Date(dateIST);
}

function formatDateIST(dateInput) {
  return new Date(dateInput).toLocaleDateString('en-CA', { timeZone: TIME_ZONE }); // "YYYY-MM-DD"
}

// kept for compatibility
function formatDate(dateInput) {
  return formatDateIST(dateInput);
}

function formatTime(dateInput = new Date()) {
  return new Date(dateInput).toLocaleTimeString('en-IN', {
    hour12: false,
    timeZone: TIME_ZONE
  }); // "HH:mm:ss"
}

function hhmmToISTDate(dateStr, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const dt = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
  const ist = new Date(dt.toLocaleString("en-US", { timeZone: TIME_ZONE }));
  return ist;
}

function timeStringToISTDate(dateStr, timeString) {
  const dt = new Date(`${dateStr}T${timeString}`);
  return new Date(dt.toLocaleString("en-US", { timeZone: TIME_ZONE }));
}

/* ---------------------------
   Salary helpers
----------------------------*/
function perDaySalary(emp) {
  const monthly = emp.givenSalary || 0;
  const fallback = 26;
  const days = emp.monthlyWorkingDays || fallback;
  return monthly / days;
}

function perHourSalary(emp) {
  const perDay = perDaySalary(emp);
  const hours = emp.dailyWorkingHours || 9;
  if (!hours || hours === 0) return 0;
  return perDay / hours;
}

/* ---------------------------
   Month helpers
----------------------------*/
function getMonthRange(year, month) {
  const mi = Number(month) - 1;
  const start = new Date(year, mi, 1);
  const end = new Date(year, mi + 1, 0, 23, 59, 59, 999);
  const days = new Date(year, mi + 1, 0).getDate();
  return { start, end, days };
}

function datesArray(year, month) {
  const { days } = getMonthRange(year, month);
  const arr = [];
  const mm = String(month).padStart(2, '0');
  for (let d = 1; d <= days; d++) {
    const dd = String(d).padStart(2, '0');
    arr.push(`${year}-${mm}-${dd}`);
  }
  return arr;
}

/* Build UTC instant for an IST local date/time */
function parseISTLocalToUTC(dateKey, timeStr = '00:00:00') {
  const [yyyy, mm, dd] = dateKey.split('-').map(Number);
  const [hh = 0, mins = 0, ss = 0] = timeStr.split(':').map(Number);
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const utcInstant = Date.UTC(yyyy, mm - 1, dd, hh, mins, ss) - istOffsetMs;
  return new Date(utcInstant);
}

/* ---------------------------
   Leave helpers
----------------------------*/

/**
 * Build leave map for a given employee in given month:
 * { "YYYY-MM-DD": { paid, isHalfDay } }
 */
async function buildLeaveMapForEmployee(employeeId, start, end) {
  const leaves = await Leave.find({
    employeeId,
    status: "Approved",
    from_date: { $lte: end },
    to_date: { $gte: start },
  }).lean();

  const leaveMap = {};

  for (const lv of leaves) {
    // normalize range inside month
    let from = lv.from_date < start ? new Date(start) : new Date(lv.from_date);
    let to = lv.to_date > end ? new Date(end) : new Date(lv.to_date);

    // iterate each day
    for (let dt = new Date(from); dt <= to; dt.setDate(dt.getDate() + 1)) {
      const key = formatDateIST(dt); // "YYYY-MM-DD"
      leaveMap[key] = {
        paid: !!lv.paid,
        isHalfDay: !!lv.isHalfDay,
        leave_type: lv.leave_type || '',
      };
    }
  }

  return leaveMap;
}

/**
 * Build holiday set for a given month
 * holidaySet has keys "YYYY-MM-DD"
 */
async function buildHolidaySet(start, end) {
  try {
    const hols = await Holiday.find({
      date: { $gte: start, $lte: end }
    }).lean();

    const set = new Set();
    for (const h of hols) {
      const key = formatDateIST(h.date);
      set.add(key);
    }
    return set;
  } catch (e) {
    // if Holiday model not ready, ignore
    console.error("Holiday fetch error (ignored):", e.message);
    return new Set();
  }
}

/* ---------------------------
   Recalculate a day's lateness/status for non-leave working days
----------------------------*/
async function recalcAttendanceRow(att, emp) {
  try {
    if (!att) return att;

    const dateKey = formatDateIST(att.date); // "YYYY-MM-DD"
    const officeStart = emp.officeStart || DEFAULT_OFFICE_START;
    const grace = typeof emp.graceMinutes === "number" ? emp.graceMinutes : DEFAULT_GRACE;

    if (!att.check_in) {
      // no check-in: absent unless already some specific status
      if (!att.status || att.status.toLowerCase() === 'absent') {
        att.isLateMinutes = 0;
        att.status = 'Absent';
      }
      return att;
    }

    const officeStartDt = hhmmToISTDate(dateKey, officeStart);
    const graceDt = new Date(officeStartDt.getTime() + grace * 60000);
    const checkInDt = timeStringToISTDate(dateKey, att.check_in);

    let lateMinutes = Math.max(0, Math.round((checkInDt - graceDt) / 60000));
    if (isNaN(lateMinutes)) lateMinutes = 0;
    att.isLateMinutes = lateMinutes;

    const halfDayThreshold = 180;  // 3 hours late
    const absentThreshold = 300;   // 5 hours late

    if (lateMinutes === 0) att.status = 'Present';
    else if (lateMinutes > 0 && lateMinutes < halfDayThreshold) att.status = 'Present';
    else if (lateMinutes >= halfDayThreshold && lateMinutes < absentThreshold) att.status = 'Half Day';
    else att.status = 'Absent';

    // salary deduction
    const hourSalary = perHourSalary(emp);
    let deductedHours = lateMinutes / 60;
    let deductionAmount = +(deductedHours * hourSalary).toFixed(2);

    if (att.status === 'Half Day') {
      deductionAmount = +(perDaySalary(emp) / 2).toFixed(2);
      att.deductedHours = (emp.dailyWorkingHours || 9) / 2;
    } else if (att.status === 'Absent') {
      deductionAmount = +(perDaySalary(emp)).toFixed(2);
      att.deductedHours = (emp.dailyWorkingHours || 9);
    } else {
      att.deductedHours = Math.round((deductedHours + Number.EPSILON) * 100) / 100;
    }

    att.deductionAmount = deductionAmount;
    return att;
  } catch (err) {
    console.error("recalcAttendanceRow error:", err);
    return att;
  }
}

/* ---------------------------
   Auto close previous day session if no check_out
----------------------------*/
async function autoClosePreviousDaySession(emp) {
  const todayKey = formatDateIST(getISTDate());
  const todayDate = new Date(todayKey);

  const last = await Attendance.findOne({
    empId: emp._id,
    check_in: { $exists: true, $ne: null },
    check_out: { $in: [null, undefined] }
  }).sort({ date: -1 });

  if (!last) return;

  const lastDateKey = formatDateIST(last.date);

  // only auto close if last date < today
  if (lastDateKey >= todayKey) return;

  const officeEnd = emp.officeEnd || DEFAULT_OFFICE_END; // "HH:mm"
  const officeEndTime = officeEnd.length === 5 ? `${officeEnd}:00` : officeEnd; // "HH:mm:ss"

  last.check_out = officeEndTime;

  try {
    const key = lastDateKey;
    const startDt = timeStringToISTDate(key, last.check_in);
    const endDt = timeStringToISTDate(key, last.check_out);
    let diff = (endDt - startDt) / (1000 * 60 * 60);
    if (diff < 0) diff = 0;
    last.workingHours = Number(diff.toFixed(2));
  } catch (e) {
    console.error("autoClose workingHours error:", e);
    last.workingHours = 0;
  }

  last.lastActive = new Date();
  await last.save();
}

/* ---------------------------
   markAttendanceCheckIn
----------------------------*/

const markAttendanceCheckIn = async (req, res) => {
  const emp = await SignUp.findById(req.body.employeeId);
  if (!emp) return res.status(404).json({ message: "Employee not found" });

  const now = new Date();
  const dateKey = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const currentTime = now.toTimeString().slice(0, 5);

  // ⭐ RULE 0: Check Holiday FIRST
  const holiday = await Holiday.findOne({ date: new Date(dateKey) });
  if (holiday) {
    return res.status(400).json({
      message: `Today is a holiday (${holiday.title}) — Attendance not allowed`,
      isHoliday: true
    });
  }

  // RULE 1: Allow check-in ONLY in office hours
  if (currentTime < emp.officeStart || currentTime > emp.officeEnd) {
    return res.status(400).json({
      message: `You can check in only between ${emp.officeStart} - ${emp.officeEnd}`,
    });
  }

  // RULE 2: existing attendance?
  let attendance = await Attendance.findOne({
    empId: emp._id,
    date: dateKey,
  });

  if (attendance && attendance.check_in) {
    return res.status(400).json({ message: "Already checked in today!" });
  }

  if (!attendance) {
    attendance = new Attendance({
      empId: emp._id,
      date: dateKey,
    });
  }

  attendance.check_in = now.toTimeString().slice(0, 8);
  attendance.status = "Present";

  await attendance.save();

  res.json({
    message: "Check-in successful",
    attendance,
  });
};

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
const getMonthlyAttendance = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;

    if (!employeeId || !month || !year)
      return res.status(400).json({ error: "Missing employeeId, month or year" });

    const emp = await SignUp.findById(employeeId).lean();
    if (!emp) return res.status(404).json({ error: "Employee not found" });

    const { start, end } = getMonthRange(Number(year), Number(month));
    const dateKeys = datesArray(Number(year), Number(month));
    const todayKey = formatDateIST(new Date());

    const [attendanceRecords, leaveMap, holidaySet] = await Promise.all([
      Attendance.find({
        empId: employeeId,
        date: { $gte: start, $lte: end }
      }).lean(),
      buildLeaveMapForEmployee(employeeId, start, end),
      buildHolidaySet(start, end)
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
      totalDeduction: 0
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

      // FUTURE DATE -> show "-" only
      if (key > todayKey) {
        output.push(row);
        continue;
      }

      const isSunday = weekday === 0;
      const isHoliday = holidaySet.has(key);

      const att = recordMap[key];
      const leaveInfo = leaveMap[key];

      // 1) Holiday / Sunday (no leave applied)
      if (isSunday || isHoliday) {
        row.status = "Holiday";
        summary.holiday++;
        output.push(row);
        continue;
      }

      // 2) Attendance record exists
      if (att) {
        row.status = att.status || "-";
        row.check_in = att.check_in || null;
        row.check_out = att.check_out || null;
        row.workingHours = att.workingHours || 0;
        row.isLateMinutes = att.isLateMinutes || 0;

        const s = (att.status || '').toLowerCase();
        if (s === 'present') summary.present++;
        if (s === 'absent') summary.absent++;
        if (s === 'half day') summary.halfday++;
        if (s === 'paid leave') summary.paidLeaves++;
        if (s === 'unpaid leave') summary.unpaidLeaves++;
        if (s === 'half day leave') summary.halfday++;

        if (row.isLateMinutes > 0) {
          summary.lateCount++;
          summary.lateHours += row.isLateMinutes / 60;
        }

        if (att.deductionAmount) {
          summary.totalDeduction += att.deductionAmount;
        }

      } else if (leaveInfo) {
        // 3) No attendance, but leave exists
        if (leaveInfo.isHalfDay) {
          row.status = "Half Day Leave";
          summary.halfday++;

          if (leaveInfo.paid) {
            summary.paidLeaves++;
          } else {
            summary.unpaidLeaves++;
            summary.totalDeduction += perDaySalary(emp) / 2;
          }
        } else {
          row.status = leaveInfo.paid ? "Paid Leave" : "Unpaid Leave";
          if (leaveInfo.paid) {
            summary.paidLeaves++;
          } else {
            summary.unpaidLeaves++;
            summary.totalDeduction += perDaySalary(emp);
          }
        }
      } else {
        // 4) Working day, past or today, no attendance, no leave => Absent
        row.status = "Absent";
        summary.absent++;
        summary.totalDeduction += perDaySalary(emp);
      }

      output.push(row);
    }

    summary.lateHours = Number(summary.lateHours.toFixed(2));
    summary.totalDeduction = Number(summary.totalDeduction.toFixed(2));

    res.json({ data: output, summary });

  } catch (err) {
    console.error("getMonthlyAttendance error:", err);
    res.status(500).json({ error: "Server error" });
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
  markAttendanceCheckIn,
  markAttendanceCheckOut,
  getTodayAttendance,
  getMonthlyAttendance,
  adminUpdateOfficeTiming,
};
