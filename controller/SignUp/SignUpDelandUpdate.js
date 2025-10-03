
    const SignUp = require('../../model/SignUp/SignUp');
     
    const updateUser = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Start with request body data
    const updateData = { ...req.body };

    // ❌ Prevent overwriting file fields with wrong values from req.body
    delete updateData.resumeFile;
    delete updateData.img;

    // ✅ Only update if new file uploaded
    if (req.files?.resumeFile) {
      updateData.resumeFile = `${req.protocol}://${req.get("host")}/uploads/resumes/${req.files.resumeFile[0].filename}`;
    }

    if (req.files?.img) {
      updateData.img = `${req.protocol}://${req.get("host")}/uploads/images/${req.files.img[0].filename}`;
    }

    const updatedUser = await SignUp.findOneAndUpdate(
      { employeeId },
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("updateUser error:", error);
    res.status(500).json({ error: error.message });
  }
};
    const deleteUser = async (req, res) => {
    try {
        const deletedUser = await SignUp.findOneAndDelete({
        employeeId: req.params.employeeId,
        }).sort({ createdAt: -1 });

        if (!deletedUser) {
        return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
    };

    module.exports = { updateUser, deleteUser };
