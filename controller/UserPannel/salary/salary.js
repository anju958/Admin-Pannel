const Attendance = require("../../../model/Attendance/Attendance");
const Leave = require("../../../model/userPannel/Leaves/Leaves");
const Salary = require("../../../model/userPannel/Salary/Salary");
const SignUp = require("../../../model/SignUp/SignUp");

// ==========================================================
//  GENERATE SALARY
// ==========================================================
exports.generateSalary = async (req, res) => {
  try {
    const { empId } = req.params;
    const { month, year } = req.body;

    // 1️⃣ Get employee
    const employee = await SignUp.findById(empId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // 2️⃣ Basic Pay
    const basicPay = employee.givenSalary;
    if (!basicPay) return res.status(400).json({ message: "givenSalary not assigned" });

    const perDaySalary = basicPay / 30;

    // 3️⃣ Attendance of the month
    const attendance = await Attendance.find({
      empId,
      date: {
        $gte: new Date(`${year}-${month}-01`),
        $lte: new Date(`${year}-${month}-31`)
      }
    });

    let present = 0, absent = 0, halfDay = 0;

    attendance.forEach(a => {
      if (a.status === "Present") present++;
      if (a.status === "Absent") absent++;
      if (a.status === "Half Day") halfDay++;
    });

    // 4️⃣ Leaves for the month
    const leaves = await Leave.find({
      employeeId: empId,
      status: "Approved",
      from_date: { $lte: new Date(`${year}-${month}-31`) },
      to_date: { $gte: new Date(`${year}-${month}-01`) }
    });

    let paidLeaves = 0, unpaidLeaves = 0;

    leaves.forEach(l => {
      if (l.paid) paidLeaves += l.days;
      else unpaidLeaves += l.days;
    });

    // 5️⃣ Deductions
    const absentDeduction = absent * perDaySalary;
    const halfDayDeduction = halfDay * (perDaySalary / 2);
    const unpaidLeaveDeduction = unpaidLeaves * perDaySalary;

    const totalDeductions = absentDeduction + halfDayDeduction + unpaidLeaveDeduction;
    const netPay = basicPay - totalDeductions;

    // 6️⃣ Save Salary
    const salary = await Salary.create({
      employeeId: empId,
      month,
      year,
      basicPay,
      allowances: 0,

      totalPresent: present,
      totalAbsent: absent,
      totalHalfDays: halfDay,
      paidLeaves,
      unpaidLeaves,

      perDaySalary,
      deductions: totalDeductions,
      netPay,
      status: "Paid",
    });

    return res.json({
      message: "Salary generated successfully",
      salary
    });

  } catch (error) {
    console.error("Generate Salary Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// ==========================================================
//  MANUAL RE-CALCULATION OF SALARY
// ==========================================================
exports.regenSalary = async (req, res) => {
  try {
    const { empId } = req.params;
    const { month, year } = req.body;

    // Delete old salary if exists
    await Salary.findOneAndDelete({
      employeeId: empId,
      month,
      year
    });

    // Call generateSalary() again
    req.params.empId = empId;
    return exports.generateSalary(req, res);

  } catch (error) {
    console.error("Recalculate Salary Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
