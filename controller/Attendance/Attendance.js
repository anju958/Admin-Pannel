const attendancee = require('../../model/Attendance/Attendance');
const SignUp = require('../../model/SignUp/SignUp')

const add_attendance = async (req, res) => {
  try {
    const { empId, employeeId, date, check_in, check_out, status, remark } = req.body;

    if ((!empId && !employeeId) || !date || !status) {
      return res.status(400).json({ message: "empId/employeeId, date, status are required" });
    }

    let employee;
    if (empId) {
      employee = await SignUp.findById(empId);
    } else if (employeeId) {
      employee = await SignUp.findOne({ employeeId });
    }

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const doc = await attendancee.findOneAndUpdate(
      { empId: employee._id, date: d },
      {
        $set: {
          empId: employee._id,
          check_in,
          check_out,
          status,
          remark
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ message: "Attendance saved", data: doc });
  } catch (error) {
    console.error("Error saving attendance:", error);
    res.status(500).json({
      message: "Error saving attendance",
      error: error.message
    });
  }
};


const getAttendance = async (req, res) => {
  try {
    const data = await attendancee
      .find()
      .populate("empId", "employeeId ename designation")
      .sort({ date: -1, createdAt: -1 });
     

    res.json(data);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Error fetching attendance" });
  }
};


module.exports = { add_attendance, getAttendance }

