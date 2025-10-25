const Leave = require('../../../model/userPannel/Leaves/Leaves');
const SignUp = require('../../../model/SignUp/SignUp');
const Project = require('../../../model/Project/Projects');

// Add a new leave for an employee
// const addLeave = async (req, res) => {
//   try {
//     // Accept either `userId` or `employeeId`
//     const employeeIdentifier = req.body.userId || req.body.employeeId || req.user?.employeeId;
//     const leave_type = req.body.leave_type;
//     const from_date = req.body.from_date || req.body.startDate;
//     const to_date = req.body.to_date || req.body.endDate;
//     const reason = req.body.reason;

//     if (!employeeIdentifier || !leave_type || !from_date || !to_date || !reason) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     // Find employee
//     const emp = await SignUp.findById(employeeIdentifier) || await SignUp.findOne({ employeeId: employeeIdentifier });
//     if (!emp) return res.status(404).json({ message: "Employee not found" });

//     // Validate dates
//     const start = new Date(from_date);
//     const end = new Date(to_date);
//     if (isNaN(start) || isNaN(end) || end < start) {
//       return res.status(400).json({ message: "Invalid date range" });
//     }

//     // Calculate days
//     const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

//     // Create leave
//     const leave = new Leave({
//       employeeId: emp._id, // use ObjectId
//       leave_type,
//       from_date: start,
//       to_date: end,
//       reason,
//       days,
//       status: "Pending"
//     });

//     await leave.save();
//     res.status(201).json({ message: "Leave applied successfully", leave });

//   } catch (error) {
//     console.error("Error in addLeave:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };


const addLeave = async (req, res) => {
    try {
        // Accept either `userId` or `employeeId`
        const employeeIdentifier = req.body.userId || req.body.employeeId || req.user?.employeeId;
        const leave_type = req.body.leave_type;
        const from_date = req.body.from_date || req.body.startDate;
        const to_date = req.body.to_date || req.body.endDate;
        const reason = req.body.reason;

        if (!employeeIdentifier || !leave_type || !from_date || !to_date || !reason) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Find employee
        const emp = await SignUp.findById(employeeIdentifier) || await SignUp.findOne({ employeeId: employeeIdentifier });
        if (!emp) return res.status(404).json({ message: "Employee not found" });

        // Validate dates
        const start = new Date(from_date);
        const end = new Date(to_date);
        if (isNaN(start) || isNaN(end) || end < start) {
            return res.status(400).json({ message: "Invalid date range" });
        }

        // Check for overlapping leaves
        const overlap = await Leave.findOne({
            employeeId: emp._id,
            $or: [
                { from_date: { $lte: end }, to_date: { $gte: start } }
            ]
        });
        if (overlap) {
            return res.status(409).json({ message: "Leave already applied for the selected date(s)" });
        }

        // Calculate days
        const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

        // Create leave
        const leave = new Leave({
            employeeId: emp._id, // use ObjectId
            leave_type,
            from_date: start,
            to_date: end,
            reason,
            days,
            status: "Pending"
        });

        await leave.save();
        res.status(201).json({ message: "Leave applied successfully", leave });

    } catch (error) {
        console.error("Error in addLeave:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// Get leave history for employee
const getLeaveHistory = async (req, res) => {
    try {
        const employeeId = req.user?.employeeId || req.params.employeeId || req.query.employeeId;
        if (!employeeId) return res.status(400).json({ message: "employeeId is required" });

        const emp = await SignUp.findById(employeeId) || await SignUp.findOne({ employeeId });
        if (!emp) return res.status(404).json({ message: "Employee not found" });

        const history = await Leave.find({ employeeId: emp._id }).sort({ from_date: -1 });
        res.json(history);
    } catch (error) {
        console.error("Error fetching leave history:", error);
        res.status(500).json({ message: "Error fetching leave history", error: error.message });
    }
};

// Get all leaves for employee (for frontend table)
const getAllLeaves = async (req, res) => {
    try {
        const { employeeId } = req.params;
        if (!employeeId) return res.status(400).json({ message: "employeeId is required" });

        const emp = await SignUp.findById(employeeId) || await SignUp.findOne({ employeeId });
        if (!emp) return res.status(404).json({ message: "Employee not found" });

        const leaves = await Leave.find({ employeeId: emp._id }).sort({ from_date: -1 });
        res.json(leaves);
    } catch (error) {
        console.error("Error fetching leaves:", error);
        res.status(500).json({ message: "Error fetching leaves", error: error.message });
    }
};

// Get monthly approved leaves
const getMonthlyAcceptedLeaves = async (req, res) => {
    try {
        const { employeeId } = req.params;
        if (!employeeId) return res.status(400).json({ message: "employeeId is required" });

        const emp = await SignUp.findById(employeeId) || await SignUp.findOne({ employeeId });
        if (!emp) return res.status(404).json({ message: "Employee not found" });

        const now = new Date();
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const leaves = await Leave.find({
            employeeId: emp._id,
            status: "Approved",
            from_date: { $gte: startMonth, $lte: endMonth }
        }).sort({ from_date: 1 });

        res.json(leaves);
    } catch (error) {
        console.error("Error fetching monthly leaves:", error);
        res.status(500).json({ message: "Error fetching monthly leaves", error: error.message });
    }
};

// Get total projects
const getTotalProjects = async (req, res) => {
    try {
        const { employeeId } = req.params;
        if (!employeeId) return res.status(400).json({ message: "employeeId is required" });

        const emp = await SignUp.findById(employeeId) || await SignUp.findOne({ employeeId });
        if (!emp) return res.status(404).json({ message: "Employee not found" });

        const count = await Project.countDocuments({ assignedEmployees: emp._id });
        res.json({ totalProjects: count });
    } catch (error) {
        console.error("Error fetching project count:", error);
        res.status(500).json({ message: "Error fetching project count", error: error.message });
    }
};

module.exports = {
    addLeave,
    getLeaveHistory,
    getAllLeaves,
    getTotalProjects,
    getMonthlyAcceptedLeaves
};
