const JobOpening = require('../../model/JobOpening/JobOpening')

const Job_Opening = async (req, res) => {
    try {
        const { deptName, designation, no_of_Opening,selected_emp,  mini_salary, max_salary, skills, job_des, job_type,opend_Date,close_date } = req.body;
        const new_job = new JobOpening({
            deptName, designation, no_of_Opening,selected_emp, mini_salary, max_salary, skills, job_des, job_type,opend_Date,close_date
        })

        const save_job = await new_job.save();
        return res.status(200).json({ message: "Job Added " })

    } catch (error) {

        console.log(error.message)
        res.status(500).json({message:error.message})
    }

}
 const get_JobOpening = async(req , res)=>{
    try {
        const getData = await JobOpening.find()
         .sort({ createdAt: -1 });
         res.status(200).json(getData)

    } catch (error) {
          res.status(500).json({message:"Error Fetching user",error:error,})
    }
 }
module.exports={Job_Opening , get_JobOpening} 