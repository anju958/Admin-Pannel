const SignUp = require('../../model/SignUp/SignUp')

const updateUser = async (req, res) => {
    try {
        if (req.file) {
            updateData.resumeFile = req.file.filename;
        }


        if (req.file) {
            updateData.resumeFile = req.file.filename;  
                }


        const UpdateUser = await SignUp.findOneAndUpdate(
            { employeeId: req.params.employeeId },
            req.body,
            { new: true }
        );
        if (!UpdateUser) {
            return res.status(404).json({ message: "User not Found" })
        }

        res.json({ message: "User Update Sucessfully" }, UpdateUser)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

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
}

module.exports = { updateUser, deleteUser }