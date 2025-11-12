// backend/socket.js
const { Server } = require("socket.io");
const Chat = require("./model/Chat/Chat");
const jwt = require("jsonwebtoken");
const Users = require("./model/Users/Users");
const SignUp = require("./model/SignUp/SignUp");
const ClientLead = require("./model/ClientLead/ClientLead");

let io;
const onlineUsers = new Map(); // userId -> socket.id

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  console.log("⚡ Socket.io initialized");

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    // When client registers (after auth)
    socket.on("register", async (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = String(decoded._id);

        socket.userId = userId;
        onlineUsers.set(userId, socket.id);

        console.log("🟢 User online:", userId);

        // Broadcast presence
        io.emit("presence:update", { userId, isOnline: true });
      } catch (err) {
        console.error("Register failed:", err.message);
      }
    });

    // Handle sending messages
    socket.on("send_message", async ({ receiverId, message }) => {
      if (!socket.userId || !receiverId || !message) return;

      const senderId = socket.userId;
      const timestamp = new Date();
      const s = String(senderId);
      const r = String(receiverId);
      const roomKey = s < r ? `${s}|${r}` : `${r}|${s}`;

      const newMsg = await Chat.create({
        senderId,
        receiverId,
        message,
        timestamp,
        roomKey,
        read: false,
      });

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message:new", newMsg);
      }

      // Send back to sender too
      socket.emit("message:new", newMsg);
    });

    // Typing indicators
    socket.on("typing:start", (receiverId) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing:start", socket.userId);
      }
    });

    socket.on("typing:stop", (receiverId) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing:stop", socket.userId);
      }
    });

    // On disconnect
    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit("presence:update", { userId: socket.userId, isOnline: false });
        console.log("🔴 User offline:", socket.userId);
      }
    });
  });

  return io;
}

module.exports = { initSocket, io };
