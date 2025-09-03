const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken");
const SignUp = require('../../model/SignUp/SignUp')

const UserLogin = async (req, res) => {
  try {
    const { official_email, password } = req.body;

    const employee = await SignUp.findOne({ official_email, userType: "employee" });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

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
      role: employee.userType,
      official_email: employee.official_email,
    });
  } catch (error) {
    res.status(500).json({ message: "Login error", error: error.message });
  }
}

module.exports = { UserLogin }
