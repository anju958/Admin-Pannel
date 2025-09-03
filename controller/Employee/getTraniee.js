const SignUp = require('../../model/SignUp/SignUp')

const getTrainee = async (req , res)=>{
    try {
        const get_trainee = await SignUp.find({  userType: { $in: ["trainee", "intern"] }}).sort({ createdAt: -1 })
        res.status(200).json(get_trainee)
        
    } catch (error) {
         res.status(500).json({ message: "Error fetching employees", error: err });
    }
}
module.exports={getTrainee}