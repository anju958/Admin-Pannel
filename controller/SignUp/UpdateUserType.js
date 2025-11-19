
const SignUp = require('../../model/SignUp/SignUp')
const mongoose = require("mongoose");

const UpdateType = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { userType } = req.body;

        const updateType = await SignUp.findOneAndUpdate(
            { employeeId },
            { userType },
            { new: true }  // returns updated document
        );

        if (!updateType) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Move to Employee Successfully", user: updateType });

    } catch (error) {
        console.error("UpdateType error:", error);
        res.status(500).json({ error: error.message });
    }
};
const getAllEmployees = async (req, res) => {
  try {
    const employees = await SignUp.find()
      .populate("department", "deptName")
      .populate("service", "serviceName")
      .sort({ createdAt: -1 });

    return res.status(200).json(employees);
  } catch (err) {
    console.error("Error in getAllEmployees:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ========================
// DELETE EMPLOYEE BY _id OR employeeId
// ========================
const deleteEmployee = async (req, res) => {
  try {
    const id = req.params.id;

    // Try as MongoDB ObjectId
    let user = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await SignUp.findById(id);
    }

    // If not found, try employeeId
    if (!user) {
      user = await SignUp.findOne({ employeeId: id });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

    return res.status(200).json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Delete employee error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { UpdateType  , deleteEmployee , getAllEmployees};
