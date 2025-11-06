

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

    // Pending projects: endDate is in future or no endDate set
    const pendingProjects = projects.filter(p => {
      if (!p.endDate) return true; // No end date = ongoing
      return new Date(p.endDate) > new Date(); // End date in future = ongoing
    }).length;

    // Completed projects
    const completedProjects = projects.filter(p => {
      if (!p.endDate) return false;
      return new Date(p.endDate) <= new Date(); // End date in past = completed
    }).length;

    // 2. Fetch all leaves of the employee
    const leaves = await Leave.find({ employeeId });
    const totalLeaves = leaves.length;

    // Pending leaves (status: Pending)
    const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;

    // Approved leaves
    const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;

    // Rejected leaves
    const rejectedLeaves = leaves.filter(l => l.status === 'Rejected').length;

    // 3. Return stats
    res.json({
      projects: {
        total: totalProjects,
        pending: pendingProjects,
        completed: completedProjects
      },
      leaves: {
        total: totalLeaves,
        pending: pendingLeaves,
        approved: approvedLeaves,
        rejected: rejectedLeaves
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getEmployeeStats };
