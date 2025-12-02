const Attendance = require("../../../model/Attendance/Attendance");
const Leave = require("../../../model/userPannel/Leaves/Leaves");
const Salary = require("../../../model/userPannel/Salary/Salary");
const SignUp = require("../../../model/SignUp/SignUp");
const SalaryAccessRequest = require('../../../model/userPannel/Salary/salaryAccessRequests')

const monthToNumber = {
  January: 1, February: 2, March: 3, April: 4,
  May: 5, June: 6, July: 7, August: 8,
  September: 9, October: 10, November: 11, December: 12
};


// ==========================================================
//  GENERATE SALARY
// ==========================================================


const generateSalary = async (req, res) => {
    try {
        const { empId } = req.params;
        const { month, year } = req.body;

        // Month name → number mapping
        const monthToNumber = {
            January: 1, February: 2, March: 3, April: 4,
            May: 5, June: 6, July: 7, August: 8,
            September: 9, October: 10, November: 11, December: 12
        };

        const m = monthToNumber[month];
        if (!m) return res.status(400).json({ message: "Invalid month format" });

        // Correct date range
        const from = new Date(year, m - 1, 1);      // e.g. 2025, 10, 1
        const to = new Date(year, m, 0);            // last day of this month

        // 1️⃣ Get employee
        const employee = await SignUp.findById(empId);
        if (!employee) return res.status(404).json({ message: "Employee not found" });

        const basicPay = employee.givenSalary || 0;
        const perDaySalary = basicPay / 30;

        // 2️⃣ Fetch Attendance (correct field is employeeId)
        const attendance = await Attendance.find({
            employeeId: empId,
            date: { $gte: from, $lte: to },
        });

        // 3️⃣ Fetch Leaves
        const leaves = await Leave.find({
            employeeId: empId,
            status: "Approved",
            from_date: { $lte: to },
            to_date: { $gte: from },
        });

        // 4️⃣ Calculate Salary
        const cal = calculateSalary({
            basicPay,
            perDaySalary,
            attendance,
            leaves,
        });

        // 5️⃣ Create Salary Record
        const salary = await Salary.create({
            employeeId: empId,
            employeeName: employee.ename,   // FIXED
            month,
            year,

            basicPay,
            perDaySalary,

            totalPresent: cal.present,
            totalAbsent: cal.absent,
            totalHalfDays: cal.halfDay,
            paidLeaves: cal.paidLeaves,
            unpaidLeaves: cal.unpaidLeaves,

            deductionDetails: cal.deductionDetails,
            deductions: cal.totalDeductions,
            netPay: cal.netPay,

            status: "Pending",
        });

        return res.json({
            message: "Salary generated successfully",
            salary,
        });

    } catch (error) {
        console.error("Generate Salary Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};




// ==========================================================
//  MANUAL RE-CALCULATION OF SALARY
// ==========================================================
const regenSalary = async (req, res) => {
    try {
        const { empId } = req.params;
        const { month, year } = req.body;

        await Salary.findOneAndDelete({
            employeeId: empId,
            month,
            year,
        });

        return generateSalary(req, res);

    } catch (error) {
        console.error("Regen Salary Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};



const markSalaryPaid = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Salary ID missing" });
        }

        const updated = await Salary.findByIdAndUpdate(
            id,
            { status: "Paid" },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Salary record not found" });
        }

        res.json(updated);

    } catch (error) {
        console.error("Mark Paid Error:", error);
        res.status(500).json({ error: "Server Error" });
    }
};





// ==========================================================
//  GET SALARY BY MONTH FOR EMPLOYEE PANEL
// ==========================================================
const getSalaryByMonth = async (req, res) => {
  try {
    const { empId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year are required" });
    }

    // 1️⃣ Get salary for the month
    const salary = await Salary.findOne({
      employeeId: empId,
      month,
      year: Number(year)
    });

    if (!salary) {
      return res.json({
        message: "Salary not generated for this month",
        summary: {
          totalSalary: 0,
          totalDeductions: 0,
          netPay: 0
        },
        attendanceSummary: null,
        deductionsBreakdown: null,
        salaryDetails: null
      });
    }

    // 2️⃣ Summary
    const summary = {
      totalSalary: salary.basicPay,
      totalDeductions: salary.deductions,
      netPay: salary.netPay
    };

    // 3️⃣ Attendance Summary
    const attendanceSummary = {
      present: salary.totalPresent,
      absent: salary.totalAbsent,
      halfDay: salary.totalHalfDays,
      paidLeaves: salary.paidLeaves,
      unpaidLeaves: salary.unpaidLeaves,
      workingHours: salary.totalWorkingHours || "0"
    };

    // 4️⃣ Deduction Breakdown
    const deductionsBreakdown = {
      absentDeduction:
        salary.totalAbsent * salary.perDaySalary,
      halfDayDeduction:
        salary.totalHalfDays * (salary.perDaySalary / 2),
      unpaidLeaveDeduction:
        salary.unpaidLeaves * salary.perDaySalary
    };

    return res.json({
      summary,
      attendanceSummary,
      deductionsBreakdown,
      salaryDetails: salary
    });

  } catch (error) {
    console.log("Get Salary By Month Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSalaryHistory = async (req, res) => {
    try {
        const { empId } = req.params;

        const history = await Salary.find({ employeeId: empId }).sort({
            year: -1,
            month: -1,
        });

        res.json(history);
    } catch (err) {
        console.log("Salary History Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};




const requestAccess   = async (req, res) => {
  try {
    const { empId, month, year } = req.body;

    const request = await SalaryAccessRequest.create({
      employeeId: empId,
      month,
      year
    });


    return res.json({ message: "Request sent", request });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server Error" });
  }
};

const approveAccess = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await SalaryAccessRequest.findByIdAndUpdate(
      requestId,
      { status: "Approved" },
      { new: true }
    );

    // Make salary accessible
    await Salary.updateOne(
      { employeeId: request.employeeId, month: request.month, year: request.year },
      { $set: { isAccessibleToEmployee: true } }
    );

    res.json({ message: "Access Approved", request });

  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};

//admin controller

const regenerateSalary = async (req, res) => {
  try {
    const { empId, month, year } = req.params;

    const employee = await SignUp.findById(empId);
    if (!employee) return res.status(404).json({ msg: "Employee not found" });

    const attendance = await Attendance.find({
      employeeId: empId,
      month,
      year,
    });

    const salary = calculateSalary(attendance, employee.basicPay);

    const updated = await Salary.findOneAndUpdate(
      { employeeId: empId, month, year },
      salary,
      { new: true }
    );

    res.json({
      msg: "Salary regenerated successfully",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err });
  }
};

// GET all salary rows + placeholder rows for employees with NO salary
const getAllSalaries = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ message: "Month and Year required" });

    const employees = await SignUp.find({}, "ename employeeId givenSalary _id");

    const salaries = await Salary.find({ month, year })
       .populate("employeeId", "ename employeeId givenSalary");

    let rows = [];

    employees.forEach(emp => {
      const salary = salaries.find(s => String(s.employeeId._id) === String(emp._id));

      if (salary) {
        rows.push(salary); // existing salaries
      } else {
        rows.push({
          _isPlaceholder: true,
          employeeId: emp,
          month,
          year,
          status: "Not Generated",
        });
      }
    });

    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};




const bulkRegenerate = async (req, res) => {
    try {
        const { month, year } = req.body;

        const employees = await SignUp.find({});

        for (const emp of employees) {
            const fakeReq = {
                params: { empId: emp._id },
                body: { month, year },
            };

            await Salary.findOneAndDelete({
                employeeId: emp._id,
                month,
                year,
            });

            await generateSalary(fakeReq, { json: () => {} });
        }

        res.json({ message: "All salaries regenerated" });

    } catch (err) {
        console.log("Bulk Regenerate Error:", err);
        res.status(500).json({ error: "Failed to regenerate salaries" });
    }
};


const calculateSalary = ({ basicPay, perDaySalary, attendance, leaves }) => {
    let present = 0, absent = 0, halfDay = 0, late = 0;

    // Attendance Count
    attendance.forEach(a => {
        if (a.status === "Present") present++;
        if (a.status === "Absent") absent++;
        if (a.status === "Half Day") halfDay++;
        if (a.status === "Late") late++;
    });

    // Leaves Count
    let paidLeaves = 0, unpaidLeaves = 0;

    leaves.forEach(l => {
        if (l.paid) paidLeaves += l.days;
        else unpaidLeaves += l.days;
    });

    // Deduction Breakdown
    const deductionDetails = {
        absent: absent * perDaySalary,
        halfDay: halfDay * (perDaySalary / 2),
        late: late * (perDaySalary * 0.25), // Late = 25% of daily salary
        unpaidLeave: unpaidLeaves * perDaySalary,
    };

    const totalDeductions =
        deductionDetails.absent +
        deductionDetails.halfDay +
        deductionDetails.late +
        deductionDetails.unpaidLeave;

    const netPay = basicPay - totalDeductions;

    return {
        present,
        absent,
        halfDay,
        late,
        paidLeaves,
        unpaidLeaves,
        deductionDetails,
        totalDeductions,
        netPay,
    };
};



const getAllEmployeesWithSalary = async (req, res) => {
  try {
    const { month, year } = req.query;

    // Load ALL EMPLOYEES
    const employees = await SignUp.find({}, "ename employeeId givenSalary");

    let result = [];

    for (let emp of employees) {
      // Check salary for this month/year
      const salary = await Salary.findOne({
        employeeId: emp._id,
        month,
        year
      });

      if (salary) {
        result.push({
          ...salary.toObject(),
          employeeName: emp.ename,
          empCode: emp.employeeId,
        });
      } else {
        // Return "Not Generated" row
        result.push({
          employeeId: emp._id,
          employeeName: emp.ename,
          empCode: emp.employeeId,
          month,
          year,
          basicPay: emp.givenSalary,
          attendance: null,
          netPay: null,
          status: "Not Generated",
        });
      }
    }

    res.json(result);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const adminGetAllSalary = async (req, res) => {
    try {
        const { month, year } = req.query;

        // 1️⃣ Get ALL employees
        const employees = await SignUp.find().select(
            "ename employeeId givenSalary"
        );

        let finalData = [];

        for (let emp of employees) {
            // 2️⃣ Find salary for this employee for selected month/year
            const salary = await Salary.findOne({
                employeeId: emp._id,
                month,
                year,
            });

            finalData.push({
                employeeDbId: emp._id,
                name: emp.ename,
                code: emp.employeeId,
                basicPay: emp.givenSalary,
                salary: salary || null,
            });
        }

        res.json(finalData);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
};


const getAllEmployeeSalary = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year required" });
    }

    // 1️⃣ Fetch all employees
    const employees = await SignUp.find({}, "ename employeeId givenSalary");

    // 2️⃣ Fetch Salary only for month+year
    const salaries = await Salary.find({ month, year });

    // Convert salary array → object for quick lookup
    const salaryMap = {};
    salaries.forEach(s => {
      salaryMap[s.employeeId] = s;
    });

    // 3️⃣ Merge Employees + Salary
    const finalList = employees.map(emp => {
      const sal = salaryMap[emp._id]; // match with employeeId

      return {
        empDbId: emp._id,                         // Mongo ID
        employeeName: emp.ename,
        employeeCode: emp.employeeId,
        basicPay: emp.givenSalary,

        // If salary exists → data else defaults
        month,
        year,
        totalPresent: sal?.totalPresent || 0,
        totalAbsent: sal?.totalAbsent || 0,
        totalHalfDays: sal?.totalHalfDays || 0,
        paidLeaves: sal?.paidLeaves || 0,
        unpaidLeaves: sal?.unpaidLeaves || 0,

        netPay: sal?.netPay || 0,
        attendance: sal ? true : false,
        status: sal ? sal.status : "Not Generated",
        salaryId: sal?._id || null
      };
    });

    res.json(finalList);

  } catch (err) {
    console.error("Salary fetch error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



// EXPORT ALL
module.exports = {
  generateSalary,
  bulkRegenerate,
  getAllSalaries , 
  regenSalary,
  getSalaryByMonth,
  getSalaryHistory,
  requestAccess,
  approveAccess,
  regenerateSalary,
  markSalaryPaid,
  getAllEmployeesWithSalary,
  getAllEmployeeSalary,
adminGetAllSalary

};
 