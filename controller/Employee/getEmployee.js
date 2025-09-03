const SignUp = require("../../model/SignUp/SignUp")


const getEmployeeData = async (req , res)=>{
    try {
        const getData = await SignUp.find({ userType: "employee" }).sort({ createdAt: -1 });
        res.status(200).json(getData)
        
    } catch (error) {
         res.status(500).json({message:"Error Fetching user",error:error,})
        
    }
}

module.exports={getEmployeeData }