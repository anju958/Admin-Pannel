const bcrypt = require('bcrypt');
const SignUpSchema = require('../../model/SignUp/SignUp')
const jobOpening = require('../../model/JobOpening/JobOpening')

const SignUpController = async (req, res) => {
    try {
        const { ename, dateOfBirth, gender, phoneNo,
            personal_email, official_email, password, fatherName,
            motherName, address, emergencyContact,
            relation, bankName, accountNo, ifscCode,
            accountHolderName, adarCardNo,
            panNo, qualification, lastExp, expWithPWT, deptName,
            designation, interviewDate, joiningDate, expectedSalary, givenSalary,
            workingTime, userType, traineeDuration ,jobId } = req.body;
        const resumeFile = req.file ? req.file.filename : null;

        const user = await SignUpSchema.findOne({ personal_email });
        if (user) {
            return res.status(400).json({ message: "Email id already Exits" });
        }
        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = new SignUpSchema({
            ename, dateOfBirth, gender, phoneNo,
            personal_email, official_email, password: hashPassword, fatherName,
            motherName, address, emergencyContact,
            relation, bankName, accountNo, ifscCode,
            accountHolderName, adarCardNo,
            panNo, qualification, lastExp, expWithPWT, deptName,
            designation, interviewDate, joiningDate, expectedSalary, givenSalary,
            workingTime, resumeFile, userType, traineeDuration,jobId 

        })
        const saveUser = await newUser.save();
        // res.status(200).json(saveUser)
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
        console.log(error.message)
        res.status(500).json({ message: error.message })
    }
}
module.exports = { SignUpController }