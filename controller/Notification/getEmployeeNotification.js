const Notification = require("../../model/Notification/adminNotification");

exports.getEmployeeNotifications = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const notifications = await Notification.find({
      user: employeeId,
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .limit(1); // 👈 only latest banner

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await Notification.findByIdAndUpdate(notificationId, {
      isRead: true,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark read" });
  }
};
exports.getTaskNotificationForEmployee = async (req, res) => {
  try {
    const { taskId, employeeId } = req.params;

    const messages = await Notification.find({
      task: taskId,
      user: employeeId
    })
      .sort({ createdAt: -1 }); // newest first

    res.json(messages); // ✅ ARRAY
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.getAdminMessagesByTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const messages = await Notification.find({ task: taskId })
      .populate("user", "ename")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to load admin messages" });
  }
};
