    const ClientLeadData = require('../../model/ClientLead/ClientLead')

    const Get_Client = async (req , res)=>{
        try {
            const getData = await ClientLeadData.find({ userType: "client" }).sort({ createdAt: -1 });
            res.status(200).json(getData)

            
        } catch (error) {
            res.status(500).json({message:"Error Fetching user",error:error,})
            
        }
    }
    const Get_Lead = async (req , res)=>{
        try {
            const getData = await ClientLeadData.find({ userType: "lead" }).sort({ createdAt: -1 });
            res.status(200).json(getData)

            
        } catch (error) {
            res.status(500).json({message:"Error Fetching user",error:error,})
            
        }
    }
    module.exports = {Get_Client ,Get_Lead}