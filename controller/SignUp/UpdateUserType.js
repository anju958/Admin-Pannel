

const SignUp = require('../../model/SignUp/SignUp')

const UpdateType = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { userType } = req.body; 
        const updateType = await SignUp.findOneAndUpdate(
            { employeeId },
            { userType },
            { new: true },
            
        ).sort({ createdAt: -1 });
        
        if (!updateType) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Move to Employee Successfully", user: updateType });

    } catch (error) {
        res.status(500).json({ error: error.message });  
    }
};

module.exports = { UpdateType };
