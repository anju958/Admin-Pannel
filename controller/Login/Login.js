    const bcrypt = require('bcrypt');
    const User = require('../../model/Users/Users'); // Your user collection with roles
    const jwt = require("jsonwebtoken");


    const LoginAdmin = async (req, res) => {
        const { official_email, password, role } = req.body; // role comes from frontend dropdown
        try {
            const user = await User.findOne({  email: official_email.toLowerCase().trim(), 
  role: role.toLowerCase().trim()  });
            console.log("Queried User:", user);
            if (!user) {
                return res.status(404).json({ message: "User with this role not found" });
            }
            console.log('Stored hash:', user.password);
            console.log('Password entered:', password);

            const isMatch = await bcrypt.compare(password, user.password);
            console.log("Password match:", isMatch);
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid credentials" });
            }
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );
            return res.json({
                message: "Login successful",
                token,
                user: {
                    _id: user._id,
                    name: user.name,
                    role: user.role,
                    email: user.email,
                    permissions: user.permissions
                }
            });
        } catch (err) {
            res.status(500).json({ message: "Login error", error: err.message });
        }
    };

    module.exports = { LoginAdmin };
