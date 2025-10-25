const SignUp = require("../../model/SignUp/SignUp");
const bcrypt = require("bcrypt");

// ✅ Employee self-update API
const updateSelfProfile = async (req, res) => {
  try {
    const employeeId = req.user?.id || req.params.id; // from auth middleware or param
    if (!employeeId) return res.status(400).json({ message: "Employee ID missing" });

    const updates = req.body;

    // Limit updates to personal fields only
    const allowedFields = [
      "ename",
      "phoneNo",
      "personal_email",
      "address",
      "emergencyContact",
      "relation",
      "qualification",
      "lastExp",
      "img",
      "resumeFile",
    ];

    // Remove disallowed fields
    Object.keys(updates).forEach((key) => {
      if (!allowedFields.includes(key)) delete updates[key];
    });

    // Handle file uploads if sent
    if (req.files) {
      if (req.files.img && req.files.img[0]) {
        updates.img = `${req.protocol}://${req.get("host")}/uploads/images/${req.files.img[0].filename}`;
      }

      if (req.files.resumeFile && req.files.resumeFile[0]) {
        updates.resumeFile = `${req.protocol}://${req.get("host")}/uploads/resumes/${req.files.resumeFile[0].filename}`;
      }
    }

    // Optional: hash password if feature is enabled later
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Update the logged-in employee
    const updatedUser = await SignUp.findByIdAndUpdate(
      employeeId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "Employee not found" });

    res.status(200).json({
      message: "Profile updated successfully",
      employee: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const employeeId = req.params.id;  // Assuming ID is sent as a URL param
    // Find employee document by _id (MongoDB ObjectId)
    const employee = await SignUp.findById(employeeId)
      .populate('department')  // Populate references if needed
      .populate('service');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error('Error in getEmployeeById:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { updateSelfProfile  , getEmployeeById};
