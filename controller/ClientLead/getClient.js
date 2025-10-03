const ClientLead = require('../../model/ClientLead/ClientLead')

const Get_Client = async (req, res) => {
    try {
        const getData = await ClientLead.find({ userType: "client" })
            .populate("department", "deptName")
            .populate("service", "serviceName")
            .populate("assign", "ename")
            .sort({ createdAt: -1 })
        res.status(200).json(getData)


    } catch (error) {
        res.status(500).json({ message: "Error Fetching user", error: error, })

    }
}
const Get_Lead = async (req, res) => {
    try {
        const getData = await ClientLead.find({ userType: "lead" })
            .populate("department", "deptName")
            .populate("service", "serviceName")
            .populate("assign", "ename")
            .sort({ createdAt: -1 })


        res.status(200).json(getData)


    } catch (error) {
        res.status(500).json({ message: "Error Fetching user", error: error.message, stack: error.stack });


    }
}
const getClientLeadById = async (req, res) => {
    try {
        const lead = await ClientLead.findOne({ leadId: req.params.leadId });
        if (!lead) {
            return res.status(404).json({ message: "Lead not found" });
        }
        res.status(200).json(lead);

    } catch (error) {
        res.status(500).json({ message: "Error fetching lead", error: error.message });

    }
}

module.exports = { Get_Client, Get_Lead, getClientLeadById }