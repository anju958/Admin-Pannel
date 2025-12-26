
const Notification = require("../../model/Notification/Notification");
const User = require("../../model/SignUp/SignUp");
const { getIO } = require("../../socket");


const sendNotification = async (req, res) => {
  const { title, body, allUsers, userIds = [] } = req.body;

  const users = allUsers
    ? []
    : userIds.map(id => ({ userId: id }));

  const notification = await Notification.create({
    title,
    body,
    allUsers,
    users
  });

  res.json({ success: true, notification });
};

const getAllNotifications = async (req, res) => {
  try {
    // Get all notifications
    const notifications = await Notification.find().sort({ createdAt: -1 }).lean();

    // Go through each notification and add recipient names
    for (let noti of notifications) {
      // If notification is for selected users
      if (!noti.allUsers && Array.isArray(noti.users) && noti.users.length > 0) {
        // Get only ObjectId list
        const userIds = noti.users.map(u => u.userId);
        // Fetch user documents
        const employees = await User.find({ _id: { $in: userIds } }, "ename name email");
        // Attach readable list to notification object
        noti.recipientNames = employees.map(e => e.ename || e.name || e.email);
      } else {
        noti.recipientNames = ["All Employees"];
      }
    }

    res.status(200).json({
      message: "✅ Fetched unique admin notifications successfully",
      notifications,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { userId } = req.body;

        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { $addToSet: { readBy: userId } }, // add user to readBy array
            { new: true }
        );

        if (!notification) return res.status(404).json({ message: "Notification not found" });

        res.status(200).json({ message: "Notification marked as read", notification });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error });
    }
};
const deleteNotice = async (req, res) => {
    try {
        const { id } = req.params; // notice ID from URL
        const deleted = await Notification.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ message: "Notice not found" });
        }

        res.json({ message: "✅ Notice deleted successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error deleting notice" });
    }
};

module.exports = {
    sendNotification,
    deleteNotice,
    
    getAllNotifications,
    markAsRead,
};