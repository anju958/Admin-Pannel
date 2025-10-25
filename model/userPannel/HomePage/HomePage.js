const Project = require('../../../model/Project/Projects');
const Leave = require('../../../model/userPannel/Leaves/Leaves');

// Get employee dashboard stats
const getEmployeeStats = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;

    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

    // 1. Fetch all projects where the employee is a member
    const projects = await Project.find({ addMember: employeeId });

    const totalProjects = projects.length;
    const pendingProjects = projects.filter(
      p => !p.endDate || new Date(p.endDate) > new Date()
    ).length;

    // 2. Fetch all leaves of the employee
    const leaves = await Leave.find({ employeeId });
    const totalLeaves = leaves.length;

    // 3. Return stats
    res.json({
      totalProjects,
      pendingProjects,
      totalLeaves
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getEmployeeStats };
