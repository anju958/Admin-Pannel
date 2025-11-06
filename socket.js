
// const { Server } = require("socket.io");

// let ioInstance = null;

// function initSocket(server) {
//   if (ioInstance) return ioInstance;

//   ioInstance = new Server(server, {
//     cors: { origin: "*", methods: ["GET","POST"] } // allow frontend
//   });

//   ioInstance.on("connection", (socket) => {
//     console.log("✅ Socket connected:", socket.id);

//     // Join a room for a user (frontend emits 'join' with userId)
//     socket.on("join", (userId) => {
//       socket.join(userId);
//       console.log(`User ${userId} joined room ${userId}`);
//     });

//     socket.on("disconnect", () => {
//       console.log("❌ Socket disconnected:", socket.id);
//     });
//   });

//   return ioInstance;
// }

// function getIO() {
//   if (!ioInstance) throw new Error("Socket.io not initialized. Call initSocket(server) first.");
//   return ioInstance;
// }

// module.exports = { initSocket, getIO };const { Server } = require("socket.io");

const { Server } = require("socket.io");
let ioInstance = null;

// Utility to save chat messages
async function saveMessageToDB(messageData) {
  const ChatModel = require("./models/Chat"); // Adjust path to your mongoose Chat model

  const chatMessage = new ChatModel({
    senderId: messageData.senderId,
    receiverId: messageData.receiverId,
    message: messageData.message,
    timestamp: new Date(messageData.timestamp),
  });

  await chatMessage.save();
}

function initSocket(server) {
  if (ioInstance) return ioInstance;

  ioInstance = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }, // allow frontend
  });

  ioInstance.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    // Join user-specific room
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room ${userId}`);

      // If user is super admin, join admin room for monitoring
      if (userId === "superadmin") {
        socket.join("adminRoom");
        console.log("Super Admin joined adminRoom for monitoring");
      }
    });

    /**
     * Message format:
     * {
     *   senderId: 'employee1',
     *   receiverId: 'admin' OR 'employee2' OR 'superadmin',
     *   message: 'Hello',
     *   timestamp: Date.now()
     * }
     */
    socket.on("sendMessage", async (messageData) => {
      try {
        // Save chat message to DB
        await saveMessageToDB(messageData);

        // Emit message to receiver's room
        ioInstance.to(messageData.receiverId).emit("receiveMessage", messageData);

        // Always emit every message to adminRoom for monitoring
        ioInstance.to("adminRoom").emit("receiveMessage", messageData);
      } catch (err) {
        console.error("Error saving or emitting chat message:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return ioInstance;
}

function getIO() {
  if (!ioInstance)
    throw new Error("Socket.io not initialized. Call initSocket(server) first.");
  return ioInstance;
}

module.exports = { initSocket, getIO };
