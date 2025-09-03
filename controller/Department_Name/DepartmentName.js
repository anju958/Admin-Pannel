const Department = require('../../model/Department/Add_Department')

const Dept_Name = async (req, res) => {
    try {
        const { deptName, designation } = req.body;
        const exitsDept = await Department.findOne({ deptName });
        let designationsArray = Array.isArray(designation) ? designation : [designation];
        if (exitsDept) {
            const updatedDept = await Department.findOneAndUpdate(
                { deptName },
                { $addToSet: { designation: { $each: designationsArray } } },
                { new: true }
            );
            return res.status(200).json(updatedDept);
        }
        const newDepartment = new Department({
            deptName,
            designation
        })
        const saveDept = await newDepartment.save()
        res.status(200).json(saveDept)

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: error.message })
    }

}
const get_Dept = async (req, res) => {
    try {
        const get_Dept_data = await Department.find().sort({ createdAt: -1 })
        res.status(200).json(get_Dept_data)
    } catch (error) {
        res.status(500).json({ message: "Error Fetching user", error: error, })

    }

}
const get_Dept_Name = async (req , res)=>{
     try {
    const depts = await Department.find({}, { _id: 0, deptId: 1, deptName: 1, designation: 1 }).sort({ createdAt: -1 });
    res.json(depts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
const get_designation = async( req , res)=>{
    try {
    const { deptName } = req.query;
    if (!deptName) return res.json([]);
    const dept = await Department.findOne({ deptName });
    res.json(dept?.designation || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
module.exports = { Dept_Name ,get_Dept , get_Dept_Name , get_designation}