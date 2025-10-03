
const bcrypt = require('bcrypt');
const SignUpSchema = require('../../model/SignUp/SignUp');
const jobOpening = require('../../model/JobOpening/JobOpening');

const SignUpController = async (req, res) => {
  try {
    const {
      ename, dateOfBirth, gender, phoneNo,
      personal_email, official_email, password, fatherName,
      motherName, address, emergencyContact,
      relation, bankName, accountNo, ifscCode,
      accountHolderName, adarCardNo,
      panNo, qualification, lastExp, expWithPWT,
      department, service,
      interviewDate, joiningDate, expectedSalary, givenSalary,
      workingTime, userType, traineeDuration, jobId
    } = req.body;

    const resumeFile = req.files?.resumeFile
      ? `${req.protocol}://${req.get("host")}/uploads/resumes/${req.files.resumeFile[0].filename}`
      : null;

    const img = req.files?.img
      ? `${req.protocol}://${req.get("host")}/uploads/images/${req.files.img[0].filename}`
      : null;

    // ✅ check if email already exists
    const user = await SignUpSchema.findOne({ personal_email });
    if (user) {
      return res.status(400).json({ message: "Email id already exists" });
    }

    // ✅ hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // ✅ create new employee
    const newUser = new SignUpSchema({
      ename, dateOfBirth, gender, phoneNo,
      personal_email, official_email, password: hashPassword, fatherName,
      motherName, address, emergencyContact,
      relation, bankName, accountNo, ifscCode,
      accountHolderName, adarCardNo,
      panNo, qualification, lastExp, expWithPWT,
      department: department, service: service,
      interviewDate, joiningDate, expectedSalary, givenSalary,
      workingTime, resumeFile, img, userType, traineeDuration, jobId
    });

    const saveUser = await newUser.save();

    // ✅ update job opening (increment selected employees)
    await jobOpening.findOneAndUpdate(
      { jobId },
      { $inc: { selected_emp: 1 } },
      { new: true }
    ).sort({ createdAt: -1 });

    return res.status(201).json({
      message: "Employee added and job updated successfully",
      employee: saveUser
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
};
const getEmployeesByService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    if (!serviceId) return res.status(400).json({ message: "Service ID required" });

    const employees = await SignUpSchema.find({ service: serviceId })
      .select("ename personal_email")  // pick fields you need
      .lean();

    // Return as { _id, name } for frontend
    const formatted = employees.map(emp => ({
      _id: emp._id,
      name: emp.ename
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


module.exports = { SignUpController, getEmployeesByService };
