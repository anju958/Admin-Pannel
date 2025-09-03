const SignUp = require('../../model/SignUp/SignUp');

const getEmpdatabyID = async (req, res) => {
    try {
        const id = req.params.employeeId;

        let employee = await SignUp.findOne({ employeeId: id }).sort({ createdAt: -1 });

        if (!employee) {
            employee = await SignUp.findById(id);
        }

        if (!employee) {
            return res.status(404).json({ message: "Not Found" });
        }

        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getEmpdatabyID };
