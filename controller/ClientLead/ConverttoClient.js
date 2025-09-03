const Lead = require('../../model/ClientLead/ClientLead')

const ConvertToClient = async (req, res) => {
    try {
        const { leadId } = req.params;
        const updateType = await Lead.findOneAndUpdate(
            { leadId },
            { userType: "client" },
            { new: true }
        );
        
        if (!updateType) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Move to Client Successfully", user: updateType });

    } catch (error) {
        res.status(500).json({ error: error.message });  
    }
};

module.exports = { ConvertToClient };
