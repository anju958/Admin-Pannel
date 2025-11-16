const mongoose = require("mongoose");
const Leave = require("../../../model/userPannel/Leaves/Leaves");
const SignUp = require("../../../model/SignUp/SignUp");

/* -------------------------------------------
   ADD LEAVE (Employee Apply Leave)
-------------------------------------------- */
const addLeave = async (req, res) => {
  try {
    const {
      employeeId,
      leave_type,        // Full Day / Half Day
      leave_category,    // Casual / Sick / Earned
      from_date,
      to_date,
      reason
    } = req.body;

    if (!employeeId || !leave_type || !from_date || !to_date || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Detect objectId or employeeId string
    const isObjectId = mongoose.Types.ObjectId.isValid(employeeId);

    const emp = isObjectId
      ? await SignUp.findById(employeeId)
      : await SignUp.findOne({ employeeId });

    if (!emp) return res.status(404).json({ message: "Employee not found" });

    // Convert dates
    const start = new Date(from_date);
    const end = new Date(to_date);

    if (end < start) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    // Prevent overlapping leave
    const overlap = await Leave.findOne({
      employeeId: emp._id,
      $or: [
        {
          from_date: { $lte: end },
          to_date: { $gte: start },
        },
      ],
    });

    if (overlap) {
      return res.status(409).json({
        message: "Leave already applied for these date(s)",
      });
    }

    // -------------------------
    // ⭐ CALCULATE LEAVE DAYS
    // -------------------------
    let days = 1;

    if (leave_type === "Half Day") {
      days = 0.5;
    } else {
      days =
        Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    // -------------------------
    // ⭐ CHECK EMPLOYEE SENIORITY
    // -------------------------
    const joiningDate = new Date(emp.joiningDate);
    const today = new Date();

    const diffMonths =
      (today.getFullYear() - joiningDate.getFullYear()) * 12 +
      (today.getMonth() - joiningDate.getMonth());

    let paid = false;

    // -------------------------
    // ⭐ RULE: 3 Months Completed?
    // -------------------------
    if (diffMonths >= 3) {
      // Check how many paid leaves used this month
      const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const paidLeavesThisMonth = await Leave.countDocuments({
        employeeId: emp._id,
        paid: true,
        from_date: { $gte: startMonth, $lte: endMonth },
      });

      // Allow only 1 paid leave per month
      if (paidLeavesThisMonth < 1) {
        paid = true;
      } else {
        paid = false;
      }
    }

    // -------------------------
    // ⭐ CREATE LEAVE ENTRY
    // -------------------------
    const leave = new Leave({
      employeeId: emp._id,
      leave_type,
      leave_category,
      from_date: start,
      to_date: end,
      reason,
      days,
      isHalfDay: leave_type === "Half Day",
      paid,
      status: "Pending",
    });

    await leave.save();

    res.status(201).json({
      message: "Leave applied successfully",
      leave,
    });

  } catch (error) {
    console.error("Error in addLeave:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};




/* -------------------------------------------
   GET ALL LEAVES FOR EMPLOYEE (Table)
-------------------------------------------- */
const getAllLeaves = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId)
      return res.status(400).json({ message: "employeeId is required" });

    const isObjectId = mongoose.Types.ObjectId.isValid(employeeId);

    const emp = isObjectId
      ? await SignUp.findById(employeeId)
      : await SignUp.findOne({ employeeId });

    if (!emp)
      return res.status(404).json({ message: "Employee not found" });

    // Always get latest first
    const leaves = await Leave.find({ employeeId: emp._id })
      .sort({ _id: -1 });

    res.json(leaves);
  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({
      message: "Error fetching leaves",
      error: error.message,
    });
  }
};



/* -------------------------------------------
   GET LEAVE HISTORY (Full)
-------------------------------------------- */
const getLeaveHistory = async (req, res) => {
  try {
    const employeeId =
      req.params.employeeId ||
      req.query.employeeId ||
      req.user?.employeeId;

    if (!employeeId)
      return res.status(400).json({ message: "employeeId required" });

    const isObjectId = mongoose.Types.ObjectId.isValid(employeeId);

    const emp = isObjectId
      ? await SignUp.findById(employeeId)
      : await SignUp.findOne({ employeeId });

    if (!emp)
      return res.status(404).json({ message: "Employee not found" });

    const history = await Leave.find({ employeeId: emp._id }).sort({
      from_date: -1,
    });

    res.json(history);
  } catch (error) {
    console.error("Error fetching leave history:", error);
    res.status(500).json({
      message: "Error fetching leave history",
      error: error.message,
    });
  }
};


/* -------------------------------------------
   APPROVE / REJECT LEAVE (Admin)
-------------------------------------------- */
// const updateLeaveStatus = async (req, res) => {
//   try {
//     const { leaveId } = req.params;
//     const { status } = req.body;

//     if (!["Approved", "Rejected", "Pending"].includes(status)) {
//       return res.status(400).json({ message: "Invalid status" });
//     }

//     const leave = await Leave.findByIdAndUpdate(
//       leaveId,
//       { status },
//       { new: true }
//     );

//     if (!leave)
//       return res.status(404).json({ message: "Leave not found" });

//     res.json({ message: "Leave status updated", leave });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };


/* -------------------------------------------
   MONTHLY APPROVED LEAVES (for Dashboard)
-------------------------------------------- */
const getMonthlyAcceptedLeaves = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const now = new Date();

    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const isObjectId = mongoose.Types.ObjectId.isValid(employeeId);

    const emp = isObjectId
      ? await SignUp.findById(employeeId)
      : await SignUp.findOne({ employeeId });

    if (!emp)
      return res.status(404).json({ message: "Employee not found" });

    const leaves = await Leave.find({
      employeeId: emp._id,
      status: "Approved",
      from_date: { $gte: startMonth, $lte: endMonth },
    });

    res.json(leaves);
  } catch (error) {
    console.error("Error fetching monthly leaves:", error);
    res.status(500).json({
      message: "Error fetching monthly leaves",
      error: error.message,
    });
  }
};


/* -------------------------------------------
   EXPORT (if needed)
-------------------------------------------- */
const exportLeaves = async (req, res) => {
  // optional export API (frontend export already works with XLSX)
};


module.exports = {
  addLeave,
  getAllLeaves,
  getLeaveHistory,
  getMonthlyAcceptedLeaves,
  // updateLeaveStatus,
};
