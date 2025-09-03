const ClientLead = require('../../model/ClientLead/ClientLead')

const updateClientUser = async (req, res) => {
    try {
        
        const UpdateUser = await ClientLead.findOneAndUpdate(
            { leadId: req.params.leadId },
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

const deleteClientUser = async (req, res) => {
    try {
        const deletedUser = await ClientLead.findOneAndDelete({
            leadId: req.params.leadId,
        }).sort({ createdAt: -1 });

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = { updateClientUser, deleteClientUser }