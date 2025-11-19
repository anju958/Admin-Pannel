

const jwt = require("jsonwebtoken");

// ✅ Middleware: works for all roles
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // user info now available everywhere
    next();
  } catch (err) {
    console.error("JWT verify failed:", err.message);
    return res.status(401).json({ msg: "Invalid token" });
  }
}

// ✅ Optional: only Super Admin (for sensitive routes)
function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== "superadmin") {
    return res.status(403).json({ msg: "Forbidden: Super Admin only" });
  }
  next();
}

module.exports = { verifyToken, requireSuperAdmin };
