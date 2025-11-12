module.exports = function checkPermission(module, action) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) return res.status(401).json({ msg: "Unauthorized" });

    const role = user.role.toLowerCase();

    // full access roles
    if (role === "superadmin" || role === "manager") {
      return next();
    }

    const perms = user.permissions || {};

    if (perms[module] && perms[module].includes(action)) {
      return next();
    }

    return res.status(403).json({ msg: "Permission Denied" });
  };
};
