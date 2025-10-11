
const Notification = require("../../model/Notification/Notification");
const User = require("../../model/SignUp/SignUp");
const { getIO } = require("../../socket");

// const sendNotification = async (req, res) => {
//   try {
//     const { title, body, category, allUsers, userIds } = req.body;

//     if (!title || !body) {
//       return res.status(400).json({ message: "Title and body are required" });
//     }

//     // Check for duplicate notice for same content and category (for allUsers)
//     if (allUsers) {
//       const exists = await Notification.findOne({ title, body, category, allUsers: true });
//       if (exists) {
//         return res.status(409).json({ message: "Duplicate notification already exists" });
//       }
//     }

//     let usersArray = [];
//     if (!allUsers && userIds && userIds.length > 0) {
//       usersArray = userIds.map((id) => ({ userId: id }));
//     }

//     // Duplicate check for selected users (optional):
//     if (!allUsers && usersArray.length && userIds.length) {
//       const exists = await Notification.findOne({ title, body, category, "users.userId": { $in: userIds }});
//       if (exists) {
//         return res.status(409).json({ message: "Duplicate notification exists for selected user(s)" });
//       }
//     }

//     const newNotification = await Notification.create({
//       title,
//       body,
//       category: category || "General",
//       allUsers: allUsers || false,
//       users: usersArray,
//       userCount: usersArray.length,
//       status: "sent",
//     });

//     return res.status(201).json({
//       message: "Notification created successfully",
//       notification: newNotification,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error", error });
//   }
// };

const sendNotification = async (req, res) => {
  try {
    const { title, body, category, allUsers, userIds = [] } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" });
    }

    // All users: check for duplicate
    if (allUsers) {
      const exists = await Notification.findOne({ title, body, category, allUsers: true });
      if (exists) {
        return res.status(409).json({ message: "Duplicate notification already exists for all users" });
      }
      const newNotification = await Notification.create({
        title,
        body,
        category: category || "General",
        allUsers: true,
        users: [],
        userCount: 0,
        status: "sent",
      });
      return res.status(201).json({ message: "Notification created successfully", notification: newNotification });
    }

    // Selected users: check for duplicate per user
    if (userIds.length) {
      for (let userId of userIds) {
        const exists = await Notification.findOne({
          title,
          body,
          category,
          allUsers: false,
          "users.userId": userId,
        });
        if (exists) {
          return res.status(409).json({ message: "Duplicate notification exists for some selected user(s)" });
        }
      }
      const usersArr = userIds.map((id) => ({ userId: id }));
      const newNotification = await Notification.create({
        title,
        body,
        category: category || "General",
        allUsers: false,
        users: usersArr,
        userCount: usersArr.length,
        status: "sent",
      });
      return res.status(201).json({ message: "Notification created successfully", notification: newNotification });
    }

    return res.status(400).json({ message: "No valid recipients found" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

const getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;

        const notifications = await Notification.find({ users: userId })
            .sort({ createdAt: -1 })
            .lean();

        // mark which notifications are read for this user
        const result = notifications.map(n => ({
            ...n,
            read: n.readBy.includes(userId)
        }));

        res.status(200).json({ notifications: result });
    } catch (error) {
        console.error(error);
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

// ✅ Get all (unique) notifications (for admin)
const getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 }).lean();

        // Group by unique combination
        const uniqueMap = new Map();
        notifications.forEach((n) => {
            const key = `${n.title}-${n.body}-${n.category || ""}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, n);
            }
        });

        const uniqueNotifications = Array.from(uniqueMap.values());

        res.status(200).json({
            message: "✅ Fetched unique admin notifications successfully",
            total: uniqueNotifications.length,
            notifications: uniqueNotifications,
        });
    } catch (error) {
        console.error("❌ Error fetching all notifications:", error);
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
    getNotifications,
    getAllNotifications,
    markAsRead,
};