const ClientLeadData = require('../../model/ClientLead/ClientLead')


const Gen_ClientLead = async (req, res) => {
  try {
    const {
      leadName, emailId, phoneNo, sourse,
      department, service, project_type,
      project_price, start_date, deadline,
      startProjectDate, date, status, assign,
      userType
    } = req.body;

    // check duplicate by email
    const user = await ClientLeadData.findOne({ emailId });
    if (user) {
      return res.status(400).json({ message: "User Already Exists" });
    }

    const newClient = new ClientLeadData({
      leadName, emailId, phoneNo, sourse,
      department, service, project_type,
      project_price, start_date, deadline,
      startProjectDate, date, status,
      assign, userType
    });

    await newClient.save();
    res.status(200).json({ message: "User Added Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const Get_ClientLead = async (req, res) => {
    try {
        const data = await ClientLeadData.find().sort({ createdAt: -1 });
        return res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    // Search by leadId instead of _id
    const lead = await ClientLeadData.findOne({ leadId: id, userType: "lead" })
      .populate("department", "deptName")
      .populate("service", "serviceName")
      .populate("assign", "ename email");

    if (!lead) {
      return res.status(404).json({ message: "Lead not found or not a lead" });
    }

    res.status(200).json({ success: true, lead });
  } catch (error) {
    console.error("❌ Error fetching lead by id:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const deleteLead = async ( req , res)=>{
    try {
        const deletedUser = await ClientLeadData.findOneAndDelete({
            leadId: req.params.leadId,
        });

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User deleted successfully" });
    
        
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = { Gen_ClientLead, Get_ClientLead , deleteLead  , getLeadById};
