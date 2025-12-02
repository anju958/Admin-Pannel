// const Attendance = require('../../model/Attendance/Attendance');
// const SignUp = require('../../model/SignUp/SignUp');
// const Leave = require('../../model/userPannel/Leaves/Leaves');
// const Holiday = require("../../model/Holiday/Holiday");
// const mongoose = require('mongoose');
// /**
//  * CONFIG
//  */
// const TIME_ZONE = 'Asia/Kolkata';
// const OFFICE_START = '09:30';   // HH:mm
// const GRACE_MINUTES = 10;
// const DEDUCTION_PER = 5;
// const EXTRA_THRESHOLD = 3;

// /* ---------------------------
//    Time helpers (IST-aware)
// ----------------------------*/
// function getISTDate() {
//   const dateIST = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
//   return new Date(dateIST);
// }

// function formatDate(date) {
//   // ensure YYYY-MM-DD (local date part in IST)
//   const d = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
//   return d.toISOString().split("T")[0];
// }

// function formatTime(date) {
//   const d = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
//   return d.toTimeString().split(" ")[0];
// }

// function hhmmToISTDate(dateStr /* "YYYY-MM-DD" */, hhmm /* "09:30" */) {
//   const [h, m] = hhmm.split(':').map(Number);
//   const dt = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
//   const inst = new Date(dt.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
//   return inst;
// }

// /* convert "HH:mm:ss" string on dateStr to IST date object */
// function timeStringToISTDate(dateStr, timeString) {
//   const dt = new Date(`${dateStr}T${timeString}`);
//   return new Date(dt.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
// }

// /* ---------------------------
//    Payroll helpers
// ----------------------------*/
// function perDaySalary(emp) {
//   // safe defaults
//   const monthly = emp.givenSalary || 0;
//   // **We calculate monthly working days dynamically using calendar and holidays** elsewhere.
//   // But for per-day fallback, use 26 if no monthlyWorkingDays supplied
//   const fallback = 26;
//   const days = emp.monthlyWorkingDays || fallback;
//   return monthly / days;
// }

// /* per-hour from emp.dailyWorkingHours */
// function perHourSalary(emp) {
//   const perDay = perDaySalary(emp);
//   const hours = emp.dailyWorkingHours || 9;
//   if (!hours || hours === 0) return 0;
//   return perDay / hours;
// }


// function formatDateIST(dateInput) {
//   return new Date(dateInput).toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
// }
// function formatTimeIST(dateInput = new Date()) {
//   return new Date(dateInput).toLocaleTimeString('en-IN', { hour12: false, timeZone: TIME_ZONE });
// }
// function timeToMinutes(t) {
//   if (!t) return null;
//   const [hh, mm] = t.split(':').map(Number);
//   return hh * 60 + (mm || 0);
// }
// function getMonthRange(year, month) {
//   const mi = Number(month) - 1;
//   const start = new Date(year, mi, 1);
//   const end = new Date(year, mi + 1, 0, 23, 59, 59, 999);
//   const days = new Date(year, mi + 1, 0).getDate();
//   return { start, end, days };
// }
// function datesArray(year, month) {
//   const { days } = getMonthRange(year, month);
//   const arr = [];
//   const mm = String(month).padStart(2, '0');
//   for (let d = 1; d <= days; d++) {
//     const dd = String(d).padStart(2, '0');
//     arr.push(`${year}-${mm}-${dd}`);
//   }
//   return arr;
// }
// // Build UTC instant for an IST local date/time (so duration calc is correct)
// function parseISTLocalToUTC(dateKey, timeStr = '00:00:00') {
//   const [yyyy, mm, dd] = dateKey.split('-').map(Number);
//   const [hh = 0, mins = 0, ss = 0] = timeStr.split(':').map(Number);
//   const istOffsetMs = 5.5 * 60 * 60 * 1000;
//   const utcInstant = Date.UTC(yyyy, mm - 1, dd, hh, mins, ss) - istOffsetMs;
//   return new Date(utcInstant);
// }

// /* ---------------------------
//    markAttendanceCheckIn
//    - create attendance doc with date set to midnight IST (real Date)
//    - store check_in as HH:mm:ss IST string
// ----------------------------*/
// // async function markAttendanceCheckIn(empId) {
// //   const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: TIME_ZONE }));
// //   const dateOnly = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate()); // midnight local
// //   const checkInTime = nowIST.toLocaleTimeString('en-IN', { hour12: false });

// //   // if exists (same emp & date) -> return existing
// //   let attendance = await Attendance.findOne({ empId, date: dateOnly });
// //   if (attendance) return { checkIn: attendance.check_in, status: attendance.status };

// //   const hour = nowIST.getHours();
// //   const status = hour >= 13 ? 'Half Day' : 'Present';

// //   attendance = await Attendance.create({
// //     empId,
// //     date: dateOnly,
// //     check_in: checkInTime,
// //     status
// //   });

// //   return { checkIn: checkInTime, status };
// // }

// /* ---------------------------
//    Attendance: mark check-in
// ----------------------------*/
// async function markAttendanceCheckIn(empId) {
//   const nowIST = getISTDate();
//   const dateStr = formatDate(nowIST); // "YYYY-MM-DD"
//   const timeStr = formatTime(nowIST); // "HH:mm:ss"

//   const emp = await SignUp.findById(empId);
//   if (!emp) throw new Error("Employee not found");

//   // Save date-only
//   const dateOnly = new Date(dateStr);

//   // If there's an approved Leave for this date, return leave info
//   const approvedLeave = await Leave.findOne({
//     employeeId: emp._id,
//     status: "Approved",
//     from_date: { $lte: dateOnly },
//     to_date: { $gte: dateOnly }
//   });

//   if (approvedLeave) {
//     // create attendance as Leave if not exists
//     let att = await Attendance.findOne({ empId: emp._id, date: dateOnly });
//     if (!att) {
//       att = new Attendance({
//         empId: emp._id,
//         date: dateOnly,
//         status: "Leave",
//         remark: "Auto-created from approved leave"
//       });
//       await att.save();
//     }
//     return { checkIn: null, status: "Leave", note: "On approved leave" };
//   }

//   // If holiday (admin-marked), create attendance as Holiday (paid) and return
//   const holiday = await Holiday.findOne({ date: dateOnly });
//   if (holiday) {
//     let att = await Attendance.findOne({ empId: emp._id, date: dateOnly });
//     if (!att) {
//       att = new Attendance({
//         empId: emp._id,
//         date: dateOnly,
//         status: "Holiday",
//         remark: `Holiday: ${holiday.title}`
//       });
//       await att.save();
//     }
//     return { checkIn: null, status: "Holiday", note: "Holiday (admin marked)" };
//   }

//   // find or create attendance
//   let attendance = await Attendance.findOne({ empId: emp._id, date: dateOnly });
//   if (!attendance) attendance = new Attendance({ empId: emp._id, date: dateOnly });

//   // If check_in exists already, we update lastActive/time but do not overwrite
//   if (!attendance.check_in) {
//     attendance.check_in = timeStr;
//   } else {
//     // Keep original check_in (or you may allow multiple check-ins)
//     attendance.lastActive = new Date(); // server time
//   }

//   // Compute lateness
//   const officeStart = emp.officeStart || "09:30";
//   const grace = typeof emp.graceMinutes === "number" ? emp.graceMinutes : 10;

//   // Office start datetime in IST for this date
//   const officeStartDt = hhmmToISTDate(dateStr, officeStart);
//   const graceDt = new Date(officeStartDt.getTime() + grace * 60000); // add grace minutes

//   const checkInDt = timeStringToISTDate(dateStr, attendance.check_in);
//   let lateMinutes = Math.max(0, Math.round((checkInDt - graceDt) / 60000));
//   if (isNaN(lateMinutes)) lateMinutes = 0;

//   attendance.isLateMinutes = lateMinutes;

//   // Decide status thresholds - you can tune these numeric thresholds or make them admin-configurable
//   // Here I'd apply:
//   // - lateMinutes === 0  => Present
//   // - 0 < lateMinutes < 180 => Present but hourly deduction (late)
//   // - 180 <= lateMinutes < 300 => Half Day (3-5 hours)
//   // - >= 300 => Absent
//   const halfDayThreshold = 180; // minutes (3 hours)
//   const absentThreshold = 300; // minutes (5 hours)

//   if (!attendance.check_in) {
//     attendance.status = "Absent";
//   } else {
//     if (lateMinutes === 0) attendance.status = "Present";
//     else if (lateMinutes > 0 && lateMinutes < halfDayThreshold) attendance.status = "Present";
//     else if (lateMinutes >= halfDayThreshold && lateMinutes < absentThreshold) attendance.status = "Half Day";
//     else attendance.status = "Absent";
//   }

//   // Compute deductions for hourly late (rule 4). For half-day/absent status, we may prefer fixed cuts.
//   const hourSalary = perHourSalary(emp); // per-hour from employee salary + dailyWorkingHours
//   const deductedHours = lateMinutes / 60; // fractional
//   let deductionAmount = +(deductedHours * hourSalary).toFixed(2);

//   // If status is Half Day or Absent, cap or override deductions according to policy:
//   if (attendance.status === "Half Day") {
//     // half day cut = perDay/2
//     deductionAmount = +(perDaySalary(emp) / 2).toFixed(2);
//     // set deductedHours approx
//     attendance.deductedHours = (emp.dailyWorkingHours || 9) / 2;
//   } else if (attendance.status === "Absent") {
//     deductionAmount = +(perDaySalary(emp)).toFixed(2);
//     attendance.deductedHours = (emp.dailyWorkingHours || 9);
//   } else {
//     // hourly deduction
//     attendance.deductedHours = Math.round((deductedHours + Number.EPSILON) * 100) / 100;
//   }

//   attendance.deductionAmount = deductionAmount;

//   await attendance.save();

//   // After saving, check rule 3: if this month lateDays >= 3, create half-day monthly deduction once
//   await applyMonthlyLateThreshold(emp, attendance);

//   return {
//     checkIn: attendance.check_in,
//     status: attendance.status,
//     lateMinutes: attendance.isLateMinutes,
//     deductionAmount: attendance.deductionAmount
//   };
// }





// /* ---------------------------
//    markAttendanceCheckOut
//    - fills check_out and workingHours
// ----------------------------*


// /* ---------------------------
//    Attendance: mark check-out
// ----------------------------*/
// async function markAttendanceCheckOut(empId) {
//   const nowIST = getISTDate();
//   const dateStr = formatDate(nowIST); // "YYYY-MM-DD"
//   const timeStr = formatTime(nowIST);

//   const emp = await SignUp.findById(empId);
//   if (!emp) throw new Error("Employee not found");

//   const dateOnly = new Date(dateStr);

//   let attendance = await Attendance.findOne({ empId: emp._id, date: dateOnly });
//   if (!attendance) {
//     // If no attendance, create one (employee checks out without checking in)
//     attendance = new Attendance({ empId: emp._id, date: dateOnly, check_out: timeStr });
//     // We may want to keep check_in null and status Absent or Leave depending on rules
//   } else {
//     attendance.check_out = timeStr;
//   }

//   // Calculate working hours if check_in exists
//   if (attendance.check_in && attendance.check_out) {
//     // build IST date objects
//     const startDt = timeStringToISTDate(dateStr, attendance.check_in);
//     const endDt = timeStringToISTDate(dateStr, attendance.check_out);
//     let diff = (endDt - startDt) / (1000 * 60 * 60); // hours
//     if (diff < 0) diff = 0;
//     attendance.workingHours = +diff.toFixed(2);
//   }

//   attendance.lastActive = new Date();
//   await attendance.save();

//   return {
//     check_out: attendance.check_out,
//     workingHours: attendance.workingHours,
//     status: attendance.status
//   };
// }

// /* ---------------------------
//    Monthly late threshold (Rule 3)
//    If employee has >= 3 late days in the month, create one half-day deduction once.
// ----------------------------*/
// async function applyMonthlyLateThreshold(emp, todaysAttendance) {
//   try {
//     const now = getISTDate();
//     const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
//     const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

//     const lateDaysCount = await Attendance.countDocuments({
//       empId: emp._id,
//       date: { $gte: monthStart, $lte: monthEnd },
//       isLateMinutes: { $gt: 0 }
//     });

//     // Check if we already created this monthly deduction for this month
//     const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
//     const existing = (emp.monthlyDeductions || []).find(d => d.month === monthKey && d.type === "three-late-half-day");

//     if (lateDaysCount >= 3 && !existing) {
//       const halfDayAmt = +(perDaySalary(emp) / 2).toFixed(2);
//       emp.monthlyDeductions = emp.monthlyDeductions || [];
//       emp.monthlyDeductions.push({
//         month: monthKey,
//         type: "three-late-half-day",
//         amount: halfDayAmt,
//         reason: "3 times late in month -> half day deduction",
//         createdAt: new Date()
//       });
//       await emp.save();
//     }
//   } catch (err) {
//     console.error("applyMonthlyLateThreshold error:", err);
//   }
// }


// /* ---------------------------
//    Admin: Update employee office timing
// ----------------------------*/
// async function adminUpdateOfficeTiming(req, res) {
//   try {
//     const { employeeId } = req.params; // accepts objectId or employeeId string
//     const { officeStart, officeEnd, graceMinutes, dailyWorkingHours } = req.body;

//     // allow passing employeeId as custom employeeId string too
//     const isObjectId = mongoose.Types.ObjectId.isValid(employeeId);
//     const emp = isObjectId ? await SignUp.findById(employeeId) : await SignUp.findOne({ employeeId });

//     if (!emp) return res.status(404).json({ message: "Employee not found" });

//     if (officeStart) emp.officeStart = officeStart;
//     if (officeEnd) emp.officeEnd = officeEnd;
//     if (typeof graceMinutes !== "undefined") emp.graceMinutes = graceMinutes;
//     if (typeof dailyWorkingHours !== "undefined") emp.dailyWorkingHours = dailyWorkingHours;

//     await emp.save();

//     res.json({ message: "Office timing updated", employeeId: emp._id });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// }
// /* ---------------------------
//    getTodayAttendance
// ----------------------------*/
// const getTodayAttendance = async (req, res) => {
//   try {
//     const { employeeId } = req.query;
//     if (!employeeId) return res.status(400).json({ message: 'employeeId required' });

//     const nowKey = formatDateIST(new Date());
//     const start = parseISTLocalToUTC(nowKey, '00:00:00');
//     const end = parseISTLocalToUTC(nowKey, '23:59:59');

//     const att = await Attendance.findOne({ empId: employeeId, date: { $gte: start, $lte: end } }).lean();
//     return res.json(att || {});
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// /* ---------------------------
//    getMonthlyAttendance (per employee)
//    returns data[] and summary{}
// ----------------------------*/
// const getMonthlyAttendance = async (req, res) => {
//   try {
//     const { employeeId, month, year } = req.query;
//     if (!employeeId || !month || !year)
//       return res.status(400).json({ error: "Missing employeeId, month or year" });

//     const emp = await SignUp.findById(employeeId).lean();
//     if (!emp) return res.status(404).json({ error: "Employee not found" });

//     const { start, end } = getMonthRange(Number(year), Number(month));
//     const dateKeys = datesArray(Number(year), Number(month));

//     const attendanceRecords = await Attendance.find({
//       empId: employeeId,
//       date: { $gte: start, $lte: end },
//     }).lean();

//     const approvedLeaves = await Leave.find({
//       employeeId,
//       status: "Approved",
//       $or: [{ from_date: { $lte: end }, to_date: { $gte: start } }],
//     }).lean();

//     // Build leave map
//     const leaveMap = {};
//     approvedLeaves.forEach((lv) => {
//       const from = new Date(lv.from_date);
//       const to = new Date(lv.to_date);
//       for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
//         const key = formatDateIST(d);
//         leaveMap[key] = {
//           paid: lv.paid,
//           isHalfDay: lv.isHalfDay,
//           leave_type: lv.leave_type,
//           leave_category: lv.leave_category,
//         };
//       }
//     });

//     // Build attendance map
//     const attMap = {};
//     attendanceRecords.forEach((a) => {
//       const key = formatDateIST(a.date);
//       attMap[key] = {
//         check_in: a.check_in,
//         check_out: a.check_out,
//         workingHours: a.workingHours || 0,
//         status: a.status,
//         isLateMinutes: a.isLateMinutes || 0,
//       };
//     });

//     // counters
//     let present = 0,
//       absent = 0,
//       halfdayCount = 0,
//       holiday = 0,
//       paidLeaves = 0,
//       unpaidLeaves = 0,
//       lateCount = 0,
//       lateHours = 0;

//     const todayKey = formatDateIST(new Date());
//     const output = [];

//     // MAIN LOOP
//     for (const key of dateKeys) {
//       const obj = {
//         date: key,
//         status: null,
//         check_in: null,
//         check_out: null,
//         workingHours: 0,
//         paid: null,
//         isHalfDay: null,
//         isLateMinutes: 0,
//       };

//       // future → blank
//       if (key > todayKey) {
//         output.push(obj);
//         continue;
//       }

//       // Sunday
//       const weekday = new Date(
//         new Date(`${key}T00:00:00Z`).toLocaleString("en-US", {
//           timeZone: TIME_ZONE,
//         })
//       ).getDay();

//       if (weekday === 0) {
//         obj.status = "Holiday";
//         holiday++;
//         output.push(obj);
//         continue;
//       }

//       // Approved leave
//       if (leaveMap[key]) {
//         const lv = leaveMap[key];
//         obj.paid = lv.paid;
//         obj.isHalfDay = lv.isHalfDay;

//         if (lv.isHalfDay) {
//           obj.status = lv.paid ? "Paid Halfday" : "Unpaid Halfday";
//           halfdayCount++;
//         } else {
//           obj.status = lv.paid ? "Paid Leave" : "Unpaid Leave";
//           lv.paid ? paidLeaves++ : unpaidLeaves++;
//         }

//         output.push(obj);
//         continue;
//       }

//       const att = attMap[key];

//       // No attendance → absent
//       if (!att) {
//         obj.status = "Absent";
//         absent++;
//         output.push(obj);
//         continue;
//       }

//       // Attendance record exists
//       obj.status = att.status;
//       obj.check_in = att.check_in;
//       obj.check_out = att.check_out;
//       obj.workingHours = att.workingHours;
//       obj.isLateMinutes = att.isLateMinutes;

//       const s = att.status.toLowerCase();

//       if (s === "present") present++;
//       else if (s === "absent") absent++;
//       else if (s === "half day") halfdayCount++;
//       else if (s.includes("leave")) paidLeaves++;

//       // late
//       if (att.isLateMinutes > 0) {
//         lateCount++;
//         lateHours += att.isLateMinutes / 60;
//       }

//       output.push(obj);
//     }

//     lateHours = Number(lateHours.toFixed(2));

//     const summary = {
//       present,
//       absent,
//       halfday: halfdayCount,
//       holiday,
//       paidLeaves,
//       unpaidLeaves,
//       leave: paidLeaves + unpaidLeaves,
//       lateCount,
//       lateHours,
//       deduction: 0,
//     };

//     return res.json({ data: output, summary });

//   } catch (err) {
//     console.error("getMonthlyAttendance error:", err);
//     return res.status(500).json({ error: "Server error" });
//   }
// };

// const getMonthlyAttendanceByAdmin = async (req, res) => {
//   try {
//     const { month, year } = req.query;
//     if (!month || !year)
//       return res.status(400).json({ error: "Month & year required" });

//     // Get all employees
//     const employees = await SignUp.find({}).lean();

//     const { start, end } = getMonthRange(Number(year), Number(month));
//     const dateKeys = datesArray(Number(year), Number(month));
//     const todayKey = formatDateIST(new Date()); // "YYYY-MM-DD"

//     // Preload holidays in range (admin marked)
//     const holidayDocs = await Holiday.find({
//       date: { $gte: start, $lte: end },
//     }).lean();
//     const holidaySet = new Set(holidayDocs.map(h => formatDateIST(h.date)));

//     const output = [];

//     for (const emp of employees) {
//       // fetch this employee's approved leaves in the requested month range
//       const empLeaves = await Leave.find({
//         employeeId: emp._id,
//         status: "Approved",
//         $or: [
//           { from_date: { $lte: end }, to_date: { $gte: start } },
//         ],
//       }).lean();

//       // build leave map per day -> { paid, isHalfDay, leave_type, leave_category }
//       const leaveMap = {};
//       for (const lv of empLeaves) {
//         const from = new Date(lv.from_date);
//         const to = new Date(lv.to_date);
//         for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
//           const key = formatDateIST(d);
//           // if date outside requested month, skip
//           if (!dateKeys.includes(key)) continue;
//           // If multiple leaves overlap same day, prefer marking paid if ANY is paid
//           if (!leaveMap[key]) {
//             leaveMap[key] = {
//               paid: !!lv.paid,
//               isHalfDay: !!lv.isHalfDay,
//               leave_type: lv.leave_type || "",
//               leave_category: lv.leave_category || "",
//             };
//           } else {
//             leaveMap[key].paid = leaveMap[key].paid || !!lv.paid;
//             leaveMap[key].isHalfDay = leaveMap[key].isHalfDay || !!lv.isHalfDay;
//           }
//         }
//       }

//       // fetch all attendance records for this employee in the month
//       const attendanceRecords = await Attendance.find({
//         empId: emp._id,
//         date: { $gte: start, $lte: end },
//       }).lean();

//       const recordMap = {};
//       attendanceRecords.forEach(r => {
//         recordMap[formatDateIST(r.date)] = r;
//       });

//       // prepare employee object
//       const empObj = {
//         empId: emp._id,
//         ename: emp.ename,
//         attendance: [],
//         summary: {
//           present: 0,
//           absent: 0,
//           halfday: 0,
//           holiday: 0,
//           paidLeaves: 0,
//           unpaidLeaves: 0,
//           lateCount: 0,
//           lateHours: 0,
//           deduction: 0
//         }
//       };

//       // Loop through days of month (preserve order)
//       for (const key of dateKeys) {
//         // default row
//         const row = {
//           date: key,
//           status: null,        // null for future or blank
//           check_in: null,
//           check_out: null,
//           workingHours: 0,
//           isLateMinutes: 0,
//           paid: null,
//           isHalfDay: null
//         };

//         // Future dates -> keep null/blank (per choice A)
//         if (key > todayKey) {
//           empObj.attendance.push(row);
//           continue;
//         }

//         // Sunday -> Holiday
//         const weekday = new Date(`${key}T00:00:00`).toLocaleString("en-US", { timeZone: TIME_ZONE });
//         const w = new Date(weekday).getDay();
//         if (w === 0) {
//           row.status = "Holiday";
//           empObj.summary.holiday++;
//           empObj.attendance.push(row);
//           continue;
//         }

//         // Admin-marked holiday?
//         if (holidaySet.has(key)) {
//           row.status = "Holiday";
//           empObj.summary.holiday++;
//           empObj.attendance.push(row);
//           continue;
//         }

//         // Approved leave?
//         if (leaveMap[key]) {
//           const lv = leaveMap[key];
//           row.paid = lv.paid;
//           row.isHalfDay = lv.isHalfDay;
//           if (lv.isHalfDay) {
//             row.status = lv.paid ? "Paid Halfday" : "Unpaid Halfday";
//             empObj.summary.halfday++;
//             if (lv.paid) empObj.summary.paidLeaves += 0.5;
//             else empObj.summary.unpaidLeaves += 0.5;
//           } else {
//             row.status = lv.paid ? "Paid Leave" : "Unpaid Leave";
//             if (lv.paid) empObj.summary.paidLeaves++;
//             else empObj.summary.unpaidLeaves++;
//           }
//           empObj.attendance.push(row);
//           continue;
//         }

//         // Attendance record present?
//         const rec = recordMap[key];
//         if (!rec) {
//           row.status = "Absent";
//           empObj.summary.absent++;
//           empObj.attendance.push(row);
//           continue;
//         }

//         // Use attendance status directly (keeps employee logic consistent)
//         row.status = rec.status || "Absent";
//         row.check_in = rec.check_in || null;
//         row.check_out = rec.check_out || null;
//         row.workingHours = rec.workingHours || 0;
//         row.isLateMinutes = rec.isLateMinutes || 0;

//         const s = String(row.status).toLowerCase();
//         if (s === "present") empObj.summary.present++;
//         else if (s === "absent") empObj.summary.absent++;
//         else if (s === "half day" || s === "halfday") empObj.summary.halfday++;
//         else if (s.includes("paid leave")) empObj.summary.paidLeaves++;
//         else if (s.includes("unpaid leave")) empObj.summary.unpaidLeaves++;
//         else if (s.includes("leave")) {
//           // fallback: if status says 'Leave' (rare), consider paid/unpaid from leaveMap - but leaveMap handled earlier
//           empObj.summary.paidLeaves++;
//         }

//         // late
//         if (row.isLateMinutes > 0) {
//           empObj.summary.lateCount++;
//           empObj.summary.lateHours += row.isLateMinutes / 60;
//         }

//         empObj.attendance.push(row);
//       } // end dateKeys loop

//       // normalize lateHours
//       empObj.summary.lateHours = Number((empObj.summary.lateHours || 0).toFixed(2));

//       output.push(empObj);
//     } // end employees loop

//     return res.json(output);
//   } catch (err) {
//     console.error("getMonthlyAttendanceByAdmin error:", err);
//     return res.status(500).json({ error: "Server error" });
//   }
// };





//   module.exports = {
//     getMonthlyAttendanceByAdmin,
//     markAttendanceCheckIn,
//     markAttendanceCheckOut,
//     getTodayAttendance,
//     getMonthlyAttendance,
//     adminUpdateOfficeTiming
//   };

// controllers/Attendance.js
const Attendance = require('../../model/Attendance/Attendance');
const SignUp = require('../../model/SignUp/SignUp');
const Leave = require('../../model/userPannel/Leaves/Leaves');
const Holiday = require("../../model/Holiday/Holiday");
const mongoose = require('mongoose');

/**
 * CONFIG
 */
const TIME_ZONE = 'Asia/Kolkata';
const DEFAULT_OFFICE_START = '09:30';
const DEFAULT_GRACE = 10;

/* ---------------------------
   Time helpers (IST-aware)
----------------------------*/
function getISTDate() {
  const dateIST = new Date().toLocaleString("en-US", { timeZone: TIME_ZONE });
  return new Date(dateIST);
}

function formatDateIST(dateInput) {
  return new Date(dateInput).toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
}

function formatTime(dateInput = new Date()) {
  return new Date(dateInput).toLocaleTimeString('en-IN', { hour12: false, timeZone: TIME_ZONE });
}

function hhmmToISTDate(dateStr /* "YYYY-MM-DD" */, hhmm /* "09:30" */) {
  const [h, m] = hhmm.split(':').map(Number);
  const dt = new Date(`${dateStr}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
  const inst = new Date(dt.toLocaleString("en-US", { timeZone: TIME_ZONE }));
  return inst;
}

function timeStringToISTDate(dateStr, timeString) {
  const dt = new Date(`${dateStr}T${timeString}`);
  return new Date(dt.toLocaleString("en-US", { timeZone: TIME_ZONE }));
}

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
   Recalculate a day's lateness/status given employee timing
   - used when admin changes an employee's office timing and you want historic rows updated.
----------------------------*/
async function recalcAttendanceRow(att, emp) {
  try {
    if (!att) return att;
    const dateKey = formatDateIST(att.date); // "YYYY-MM-DD"
    const officeStart = emp.officeStart || DEFAULT_OFFICE_START;
    const grace = typeof emp.graceMinutes === "number" ? emp.graceMinutes : DEFAULT_GRACE;

    if (!att.check_in) {
      // if there's no check_in, decide whether Leave/Holiday or Absent
      // leave/holiday handled by existing flags, but keep absent if no status
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

    const halfDayThreshold = 180;
    const absentThreshold = 300;

    if (lateMinutes === 0) att.status = 'Present';
    else if (lateMinutes > 0 && lateMinutes < halfDayThreshold) att.status = 'Present';
    else if (lateMinutes >= halfDayThreshold && lateMinutes < absentThreshold) att.status = 'Half Day';
    else att.status = 'Absent';

    // deduction calculations (store deductionAmount if needed)
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
   markAttendanceCheckIn
----------------------------*/
async function markAttendanceCheckIn(empId) {
  const nowIST = getISTDate();
  const dateStr = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate()).toISOString().split('T')[0]; // YYYY-MM-DD local
  const timeStr = nowIST.toLocaleTimeString('en-IN', { hour12: false, timeZone: TIME_ZONE });

  const emp = await SignUp.findById(empId);
  if (!emp) throw new Error("Employee not found");

  const dateOnly = new Date(dateStr);

  // approved leave check
  const approvedLeave = await Leave.findOne({
    employeeId: emp._id,
    status: "Approved",
    from_date: { $lte: dateOnly },
    to_date: { $gte: dateOnly }
  });

  if (approvedLeave) {
    let att = await Attendance.findOne({ empId: emp._id, date: dateOnly });
    if (!att) {
      att = new Attendance({
        empId: emp._id,
        date: dateOnly,
        status: "Paid Leave",
        remark: "Auto-created from approved leave"
      });
      await att.save();
    }
    return { checkIn: null, status: "Leave" };
  }

  // holiday
  const holiday = await Holiday.findOne({ date: dateOnly });
  if (holiday) {
    let att = await Attendance.findOne({ empId: emp._id, date: dateOnly });
    if (!att) {
      att = new Attendance({
        empId: emp._id,
        date: dateOnly,
        status: "Holiday",
        remark: `Holiday: ${holiday.title}`
      });
      await att.save();
    }
    return { checkIn: null, status: "Holiday" };
  }

  let attendance = await Attendance.findOne({ empId: emp._id, date: dateOnly });
  if (!attendance) attendance = new Attendance({ empId: emp._id, date: dateOnly });

  if (!attendance.check_in) attendance.check_in = timeStr;
  else attendance.lastActive = new Date();

  // compute lateness using employee-specific timing
  const officeStart = emp.officeStart || DEFAULT_OFFICE_START;
  const grace = typeof emp.graceMinutes === "number" ? emp.graceMinutes : DEFAULT_GRACE;

  const officeStartDt = hhmmToISTDate(formatDateIST(attendance.date || dateOnly), officeStart);
  const graceDt = new Date(officeStartDt.getTime() + grace * 60000);

  const checkInDt = timeStringToISTDate(formatDateIST(attendance.date || dateOnly), attendance.check_in);
  let lateMinutes = Math.max(0, Math.round((checkInDt - graceDt) / 60000));
  if (isNaN(lateMinutes)) lateMinutes = 0;

  attendance.isLateMinutes = lateMinutes;

  const halfDayThreshold = 180;
  const absentThreshold = 300;

  if (!attendance.check_in) attendance.status = "Absent";
  else {
    if (lateMinutes === 0) attendance.status = "Present";
    else if (lateMinutes > 0 && lateMinutes < halfDayThreshold) attendance.status = "Present";
    else if (lateMinutes >= halfDayThreshold && lateMinutes < absentThreshold) attendance.status = "Half Day";
    else attendance.status = "Absent";
  }

  const hourSalary = perHourSalary(emp);
  const deductedHours = lateMinutes / 60;
  let deductionAmount = +(deductedHours * hourSalary).toFixed(2);

  if (attendance.status === "Half Day") {
    deductionAmount = +(perDaySalary(emp) / 2).toFixed(2);
    attendance.deductedHours = (emp.dailyWorkingHours || 9) / 2;
  } else if (attendance.status === "Absent") {
    deductionAmount = +(perDaySalary(emp)).toFixed(2);
    attendance.deductedHours = (emp.dailyWorkingHours || 9);
  } else {
    attendance.deductedHours = Math.round((deductedHours + Number.EPSILON) * 100) / 100;
  }

  attendance.deductionAmount = deductionAmount;

  await attendance.save();

  // if needed, apply monthly late threshold (your existing logic)
  // (omitted here -- you can call applyMonthlyLateThreshold if you have one)

  return {
    checkIn: attendance.check_in,
    status: attendance.status,
    lateMinutes: attendance.isLateMinutes,
    deductionAmount: attendance.deductionAmount
  };
}

/* ---------------------------
   markAttendanceCheckOut
----------------------------*/
async function markAttendanceCheckOut(empId) {
  const nowIST = getISTDate();
  const dateStr = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate()).toISOString().split('T')[0];
  const timeStr = nowIST.toLocaleTimeString('en-IN', { hour12: false, timeZone: TIME_ZONE });

  const emp = await SignUp.findById(empId);
  if (!emp) throw new Error("Employee not found");

  const dateOnly = new Date(dateStr);

  let attendance = await Attendance.findOne({ empId: emp._id, date: dateOnly });
  if (!attendance) {
    attendance = new Attendance({ empId: emp._id, date: dateOnly, check_out: timeStr, status: 'Absent' });
  } else {
    attendance.check_out = timeStr;
  }

  if (attendance.check_in && attendance.check_out) {
    // compute workingHours using IST conversions
    try {
      const startDt = timeStringToISTDate(formatDateIST(attendance.date || dateOnly), attendance.check_in);
      const endDt = timeStringToISTDate(formatDateIST(attendance.date || dateOnly), attendance.check_out);
      let diff = (endDt - startDt) / (1000 * 60 * 60);
      if (diff < 0) diff = 0;
      attendance.workingHours = Number(diff.toFixed(2));
    } catch (e) {
      attendance.workingHours = 0;
    }
  }

  attendance.lastActive = new Date();
  await attendance.save();

  return {
    check_out: attendance.check_out,
    workingHours: attendance.workingHours,
    status: attendance.status
  };
}

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

    const att = await Attendance.findOne({ empId: employeeId, date: { $gte: start, $lte: end } }).lean();
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

    const attendanceRecords = await Attendance.find({
      empId: employeeId,
      date: { $gte: start, $lte: end },
    }).lean();

    const approvedLeaves = await Leave.find({
      employeeId,
      status: "Approved",
      $or: [{ from_date: { $lte: end }, to_date: { $gte: start } }],
    }).lean();

    const leaveMap = {};
    approvedLeaves.forEach((lv) => {
      const from = new Date(lv.from_date);
      const to = new Date(lv.to_date);
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const key = formatDateIST(d);
        leaveMap[key] = {
          paid: lv.paid,
          isHalfDay: lv.isHalfDay,
          leave_type: lv.leave_type,
          leave_category: lv.leave_category,
        };
      }
    });

    const attMap = {};
    attendanceRecords.forEach((a) => {
      const key = formatDateIST(a.date);
      attMap[key] = {
        check_in: a.check_in,
        check_out: a.check_out,
        workingHours: a.workingHours || 0,
        status: a.status,
        isLateMinutes: a.isLateMinutes || 0,
      };
    });

    let present = 0,
      absent = 0,
      halfdayCount = 0,
      holiday = 0,
      paidLeaves = 0,
      unpaidLeaves = 0,
      lateCount = 0,
      lateHours = 0;

    const todayKey = formatDateIST(new Date());
    const output = [];

    for (const key of dateKeys) {
      const obj = {
        date: key,
        status: null,
        check_in: null,
        check_out: null,
        workingHours: 0,
        paid: null,
        isHalfDay: null,
        isLateMinutes: 0,
      };

      if (key > todayKey) {
        output.push(obj);
        continue;
      }

      const weekday = new Date(
        new Date(`${key}T00:00:00Z`).toLocaleString("en-US", {
          timeZone: TIME_ZONE,
        })
      ).getDay();

      if (weekday === 0) {
        obj.status = "Holiday";
        holiday++;
        output.push(obj);
        continue;
      }

      if (leaveMap[key]) {
        const lv = leaveMap[key];
        obj.paid = lv.paid;
        obj.isHalfDay = lv.isHalfDay;

        if (lv.isHalfDay) {
          obj.status = lv.paid ? "Paid Halfday" : "Unpaid Halfday";
          halfdayCount++;
        } else {
          obj.status = lv.paid ? "Paid Leave" : "Unpaid Leave";
          lv.paid ? paidLeaves++ : unpaidLeaves++;
        }

        output.push(obj);
        continue;
      }

      const att = attMap[key];

      if (!att) {
        obj.status = "Absent";
        absent++;
        output.push(obj);
        continue;
      }

      obj.status = att.status;
      obj.check_in = att.check_in;
      obj.check_out = att.check_out;
      obj.workingHours = att.workingHours;
      obj.isLateMinutes = att.isLateMinutes || 0;

      const s = (att.status || '').toLowerCase();
      if (s === "present") present++;
      else if (s === "absent") absent++;
      else if (s === "half day") halfdayCount++;
      else if (s.includes("leave")) {
        // already counted above for leaves
      }

      if (att.isLateMinutes > 0) {
        lateCount++;
        lateHours += att.isLateMinutes / 60;
      }

      output.push(obj);
    }

    lateHours = Number(lateHours.toFixed(2));

    const summary = {
      present,
      absent,
      halfday: halfdayCount,
      holiday,
      paidLeaves,
      unpaidLeaves,
      leave: paidLeaves + unpaidLeaves,
      lateCount,
      lateHours,
      deduction: 0,
    };

    return res.json({ data: output, summary });
  } catch (err) {
    console.error("getMonthlyAttendance error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ---------------------------
   getMonthlyAttendanceByAdmin
   returns array of { empId, ename, attendance: [{date,status,check_in,check_out,isLateMinutes}], summary }
----------------------------*/
const getMonthlyAttendanceByAdmin = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year)
      return res.status(400).json({ error: "Month & year required" });

    const employees = await SignUp.find({}).lean();
    const { start, end } = getMonthRange(Number(year), Number(month));
    const dateKeys = datesArray(Number(year), Number(month));

    let output = [];

    for (const emp of employees) {
      let attendanceRecords = await Attendance.find({
        empId: emp._id,
        date: { $gte: start, $lte: end }
      }).lean();

      let recordMap = {};
      attendanceRecords.forEach((r) => {
        const key = formatDateIST(r.date);
        recordMap[key] = r;
      });

      let empObj = {
        empId: emp._id,
        ename: emp.ename,
        officeStart: emp.officeStart || DEFAULT_OFFICE_START,
        officeEnd: emp.officeEnd || null,
        graceMinutes: typeof emp.graceMinutes === 'number' ? emp.graceMinutes : DEFAULT_GRACE,
        dailyWorkingHours: emp.dailyWorkingHours || 9,
        attendance: [],
        summary: {
          present: 0,
          absent: 0,
          halfday: 0,
          holiday: 0,
          paidLeaves: 0,
          unpaidLeaves: 0,
          lateCount: 0,
          lateHours: 0,
          deduction: 0
        }
      };

      for (const key of dateKeys) {
        let r = recordMap[key];
        let row = {
          date: key,
          status: '-',
          check_in: null,
          check_out: null,
          workingHours: 0,
          isLateMinutes: 0
        };

        // Sunday
        const weekday = new Date(
          new Date(`${key}T00:00:00Z`).toLocaleString("en-US", { timeZone: TIME_ZONE })
        ).getDay();

        if (weekday === 0) {
          row.status = "Holiday";
          empObj.summary.holiday++;
        }

        if (r) {
          row.status = r.status;
          row.check_in = r.check_in;
          row.check_out = r.check_out;
          row.workingHours = r.workingHours || 0;
          row.isLateMinutes = r.isLateMinutes || 0;

          const s = (r.status || '').toLowerCase();
          if (s === 'present') empObj.summary.present++;
          if (s === 'absent') empObj.summary.absent++;
          if (s === 'half day') empObj.summary.halfday++;
          if (s === 'paid leave') empObj.summary.paidLeaves++;
          if (s === 'unpaid leave') empObj.summary.unpaidLeaves++;

          if (row.isLateMinutes > 0) {
            empObj.summary.lateCount++;
            empObj.summary.lateHours += row.isLateMinutes / 60;
          }
        }

        empObj.attendance.push(row);
      }

      empObj.summary.lateHours = Number(empObj.summary.lateHours.toFixed(2));
      output.push(empObj);
    }

    res.json(output);

  } catch (err) {
    console.error("getMonthlyAttendanceByAdmin error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* ---------------------------
   Admin update one employee office timing
   PUT /api/admin/update-office-timing/:employeeId
   body: { officeStart, officeEnd, graceMinutes, dailyWorkingHours, recalcMonth, recalcYear }
   - recalcMonth & recalcYear optional => if provided, will recalc attendance rows for that employee & month
----------------------------*/
// async function adminUpdateOfficeTiming(req, res) {
//   try {
//     const { employeeId } = req.params;
//     const { officeStart, officeEnd, graceMinutes, dailyWorkingHours, recalcMonth, recalcYear } = req.body;

//     if (!employeeId) return res.status(400).json({ message: 'employeeId required' });

//     const emp = await SignUp.findById(employeeId);
//     if (!emp) return res.status(404).json({ message: "Employee not found" });

//     if (officeStart) emp.officeStart = officeStart;
//     if (officeEnd) emp.officeEnd = officeEnd;
//     if (typeof graceMinutes !== "undefined") emp.graceMinutes = Number(graceMinutes);
//     if (typeof dailyWorkingHours !== "undefined") emp.dailyWorkingHours = Number(dailyWorkingHours);

//     await emp.save();

//     // optional recalc for a month
//     if (recalcMonth && recalcYear) {
//       const { start, end } = getMonthRange(Number(recalcYear), Number(recalcMonth));
//       const rows = await Attendance.find({ empId: emp._id, date: { $gte: start, $lte: end }});
//       for (const r of rows) {
//         const updated = await recalcAttendanceRow(r, emp);
//         await Attendance.findByIdAndUpdate(r._id, updated);
//       }
//     }

//     return res.json({ message: "Office timing updated", employeeId: emp._id });
//   } catch (err) {
//     console.error("adminUpdateOfficeTiming error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// }


async function adminUpdateOfficeTiming(req, res) {
  try {
    const { employeeId } = req.params;
    const { officeStart, officeEnd, graceMinutes, dailyWorkingHours } = req.body;

    const emp = await SignUp.findById(employeeId);
    if (!emp) return res.status(404).json({ message: "Employee not found" });

    // Update ONLY timing fields
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


/* ---------------------------
   Bulk update office timing (by department or all)
   POST /api/admin/bulk-update-office-timing
   body: { filter: { departmentId } || {}, officeStart, officeEnd, graceMinutes, dailyWorkingHours, recalcMonth, recalcYear }
----------------------------*/
// async function bulkUpdateOfficeTiming(req, res) {
//   try {
//     const { filter = {}, officeStart, officeEnd, graceMinutes, dailyWorkingHours, recalcMonth, recalcYear } = req.body;

//     // build query - allow department or service or role filters
//     const query = {};
//     if (filter.departmentId) query.department = filter.departmentId;
//     if (filter.role) query.role = filter.role;

//     const employees = await SignUp.find(query);

//     for (const emp of employees) {
//       if (officeStart) emp.officeStart = officeStart;
//       if (officeEnd) emp.officeEnd = officeEnd;
//       if (typeof graceMinutes !== "undefined") emp.graceMinutes = Number(graceMinutes);
//       if (typeof dailyWorkingHours !== "undefined") emp.dailyWorkingHours = Number(dailyWorkingHours);
//       await emp.save();

//       if (recalcMonth && recalcYear) {
//         const { start, end } = getMonthRange(Number(recalcYear), Number(recalcMonth));
//         const rows = await Attendance.find({ empId: emp._id, date: { $gte: start, $lte: end }});
//         for (const r of rows) {
//           const updated = await recalcAttendanceRow(r, emp);
//           await Attendance.findByIdAndUpdate(r._id, updated);
//         }
//       }
//     }

//     return res.json({ message: `Updated ${employees.length} employees` });
//   } catch (err) {
//     console.error("bulkUpdateOfficeTiming error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// }

module.exports = {
  getMonthlyAttendanceByAdmin,
  markAttendanceCheckIn,
  markAttendanceCheckOut,
  getTodayAttendance,
  getMonthlyAttendance,
  adminUpdateOfficeTiming,
  
};
