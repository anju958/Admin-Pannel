
module.exports = function checkPermission(moduleKey, action = "View") {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const role = (user.role || "").toLowerCase();

    // ✅ FULL ACCESS ROLES
    if (["superadmin", "manager"].includes(role)) {
      return next();
    }

    const perms = user.permissions?.[moduleKey];

    // ✅ CASE 1: ARRAY permissions → ["View","Add"]
    if (Array.isArray(perms)) {
      if (perms.includes(action)) {
        return next();
      }
    }

    // ✅ CASE 2: OBJECT permissions → { view:true }
    if (typeof perms === "object" && perms !== null) {
      const key = action.toLowerCase(); // View → view
      if (perms[key] === true) {
        return next();
      }
    }

    return res.status(403).json({ msg: "Permission Denied" });
  };
};
