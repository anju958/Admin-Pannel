// backend/controller/Notification/adminNotify.js
const Task = require("../../model/Task/Task");
const Notification = require("../../model/Notification/adminNotification");

exports.notifyEmployees = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message } = req.body;

    const task = await Task.findById(taskId).populate("assignedTo");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const notifications = task.assignedTo.map((emp) => ({
      user: emp._id,
      title: `Task Update: ${task.title}`,
      message: message || "Admin sent an update on your task",
      task: task._id,
    }));

    await Notification.insertMany(notifications);

    res.json({ success: true, message: "Employees notified" });
  } catch (err) {
    console.error("ADMIN NOTIFY ERROR:", err);
    res.status(500).json({ message: "Notify failed" });
  }
};
