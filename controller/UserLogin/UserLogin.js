const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const SignUp = require('../../model/SignUp/SignUp');
const Attendance = require('../../model/Attendance/Attendance'); // Your attendance schema

// LOGIN CONTROLLER
const UserLogin = async (req, res) => {
  try {
    const { official_email, password } = req.body;

    // Find employee
    const employee = await SignUp.findOne({ official_email, userType: "employee" });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Mark attendance on login
    await markAttendanceCheckIn(employee._id);

    // Generate JWT token
    const token = jwt.sign(
      { id: employee._id, role: employee.userType },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Employee login successful",
      token,
      employeeId: employee._id,
      ename: employee.ename,
      official_email: employee.official_email,
    });
  } catch (error) {
    res.status(500).json({ message: "Login error", error: error.message });
  }
};

// LOGOUT CONTROLLER
const UserLogout = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID required" });
    }

    // Mark check-out time
    await markAttendanceCheckOut(employeeId);

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Logout error", error: error.message });
  }
};

// HELPER: Mark check-in on login
async function markAttendanceCheckIn(empId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  try {
    let attendance = await Attendance.findOne({
      empId: empId,
      date: today
    });

    if (!attendance) {
      // Create new attendance record with check-in time
      attendance = new Attendance({
        empId: empId,
        date: today,
        check_in: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        status: 'Present'
      });
      await attendance.save();
      console.log(`✅ Check-in marked for employee ${empId} at ${attendance.check_in}`);
    } else if (!attendance.check_in) {
      // If record exists but no check-in, add it
      attendance.check_in = new Date().toLocaleTimeString('en-IN', { hour12: false });
      attendance.status = 'Present';
      await attendance.save();
      console.log(`✅ Check-in updated for employee ${empId}`);
    } else {
      console.log(`ℹ️ Employee ${empId} already checked in today`);
    }
  } catch (err) {
    console.error('Error marking check-in:', err);
  }
}

// HELPER: Mark check-out on logout
async function markAttendanceCheckOut(empId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const attendance = await Attendance.findOne({
      empId: empId,
      date: today
    });

    if (attendance && !attendance.check_out) {
      attendance.check_out = new Date().toLocaleTimeString('en-IN', { hour12: false });
      await attendance.save();
      console.log(`✅ Check-out marked for employee ${empId} at ${attendance.check_out}`);
    }
  } catch (err) {
    console.error('Error marking check-out:', err);
  }
}

// GET WORKING HOURS
const getWorkingHours = async (req, res) => {
  try {
    const { employeeId, date } = req.query;

    if (!employeeId || !date) {
      return res.status(400).json({ message: "Employee ID and date required" });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      empId: employeeId,
      date: targetDate
    });

    if (!attendance) {
      return res.status(404).json({ message: "No attendance record found" });
    }

    // Calculate working hours
    let workingHours = 0;
    if (attendance.check_in && attendance.check_out) {
      const checkInTime = new Date(`${date} ${attendance.check_in}`);
      const checkOutTime = new Date(`${date} ${attendance.check_out}`);
      workingHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert to hours
    }

    res.status(200).json({
      date: attendance.date,
      check_in: attendance.check_in,
      check_out: attendance.check_out,
      workingHours: workingHours.toFixed(2),
      status: attendance.status
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching working hours", error: error.message });
  }
};

module.exports = { UserLogin, UserLogout, getWorkingHours };
