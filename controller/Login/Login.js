const bcrypt = require('bcrypt');
const SignUp = require('../../model/SignUp/SignUp');
const jwt = require("jsonwebtoken");
const ADMIN_EMAIL = 'admin@gmail.com';
const PASSWORD = 'admin1234';


const LoginAdmin = async (req, res) => {
    const { official_email, password } = req.body;
    if (official_email === ADMIN_EMAIL && password === PASSWORD) {
        const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        })
        return res.json({
            message: "Admin login successful",
            token,
            user: {
                ename: "Super Admin",
                role: "admin",
                official_email: official_email,
            },
        });
    }
    else {
        return res.status(400).json({ message: "Incorrect email and password " })
    }
};
module.exports = { LoginAdmin }
