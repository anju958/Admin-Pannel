const Department = require('../../model/Department/AddDepartment');
    

const addDepartment = async (req, res) => {
    try {
        const { deptName } = req.body;

        const existingDept = await Department.findOne({
            deptName: { $regex: `^${deptName}$`, $options: 'i' }
        });

        if (existingDept) {
            
            return res.status(400).json({ message: "Department already exists" });
        }

        const newDept = new Department({ deptName });
        const savedDept = await newDept.save();

        res.status(201).json({ message: "Department added successfully", data: savedDept });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};


const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ createdAt: -1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getDepartmentByid = async(req , res)=>{
  try {
    const { id } = req.params; 

    const dept = await Department.findById(id); 

    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json(dept); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
}


const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;   
    const { deptName } = req.body;  

    const updateDept = await Department.findByIdAndUpdate(
      id,
      { deptName },
      { new: true, runValidators: true } 
    );

    if (!updateDept) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json({ message: "Department updated successfully", data: updateDept });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params; 
    const deletedDept = await Department.findByIdAndDelete(id);

    if (!deletedDept) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};


module.exports = { addDepartment , getDepartments , updateDepartment  , getDepartmentByid , deleteDepartment};
