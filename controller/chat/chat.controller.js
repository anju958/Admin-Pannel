const Chat = require("../../model/Chat/Chat");
// your models
const Employee = require("../../model/SignUp/SignUp");
const ClientLead = require("../../model/ClientLead/ClientLead");
const AdminUser = require("../../model/Users/Users");

// --- helpers ---
const normalize = (doc, type) => {
  if (!doc) return null;

  if (type === "employee") {
    return {
      _id: String(doc.employeeId || doc._id),
      name: doc.ename || doc.name || "Employee",
      role: doc.role || "employee",
    };
  }

  if (type === "client") {
    return {
      _id: String(doc._id),
      name: doc.leadName || doc.name || "Client",
      role: "client",
    };
  }

  return {
    _id: String(doc._id),
    name: doc.name || "Admin",
    role: doc.role || "admin",
  };
};
// --- REST for history/persistence ---
exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message, timestamp } = req.body;
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ error: "senderId, receiverId, message required" });
    }
    const saved = await Chat.create({
      senderId,
      receiverId,
      message,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });
    res.json({ success: true, chat: saved });
  } catch (e) {
    res.status(500).json({ error: "Server Error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { userId, peerId, page = 1, limit = 50 } = req.query;
    const s = String(userId);
    const r = String(peerId);
    const roomKey = s < r ? `${s}|${r}` : `${r}|${s}`;

    const list = await Chat.find({ roomKey })
      .sort({ timestamp: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ messages: list });
  } catch (e) {
    res.status(500).json({ error: "Server Error" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { userId, peerId } = req.body;
    const s = String(userId);
    const r = String(peerId);
    const roomKey = s < r ? `${s}|${r}` : `${r}|${s}`;

    await Chat.updateMany(
      { roomKey, receiverId: String(userId), read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server Error" });
  }
};

// Admin feed (optional)

const Users = require("../../model/Users/Users");
exports.getAllChats = async (_req, res) => {
  try {
    const chats = await Chat.find().sort({ timestamp: -1 }).limit(500);
    res.json({ chats });
  } catch (e) {
    res.status(500).json({ error: "Server Error" });
  }
};

// List of people you can chat with

exports.getChatUsers = async (req, res) => {
  try {
    const userRole = req.user?.role || req.query.role;
    const userId = req.user?._id?.toString() || req.query.userId;

    let users = [];

    if (["superadmin", "admin", "hr", "manager"].includes(userRole)) {
      // Super Admin / Admin / HR / Manager — see employees, clients, leads
      const [employees, clients] = await Promise.all([
        SignUp.find({}, "employeeId ename role").lean(),
        ClientLead.find({}, "leadName name").lean(),
      ]);

      users = [
        ...employees.map((e) => normalize(e, "employee")),
        ...clients.map((c) => normalize(c, "client")),
      ];
    } else if (
      ["employee", "intern", "trainee"].includes(userRole)
    ) {
      // Employee — see admins, HR, superadmins
      const admins = await Users.find(
        { role: { $in: ["superadmin", "admin", "manager", "hr"] } },
        "name role"
      ).lean();

      users = admins.map((a) => normalize(a, "admin"));
    } else if (["client", "lead"].includes(userRole)) {
      // Clients or leads — see admin + accountants
      const admins = await Users.find(
        { role: { $in: ["superadmin", "admin", "accountant"] } },
        "name role"
      ).lean();
      users = admins.map((a) => normalize(a, "admin"));
    } else {
      // fallback
      const admins = await Users.find({}, "name role").lean();
      users = admins.map((a) => normalize(a, "admin"));
    }

    // Remove self
    const filtered = users.filter((u) => u._id !== String(userId));

    res.json({ success: true, users: filtered });
  } catch (error) {
    console.error("❌ getChatUsers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch chat users" });
  }
};
