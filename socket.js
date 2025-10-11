// // socket.js
// const { Server } = require("socket.io");

// let ioInstance = null;

// function initSocket(server) {
//   if (ioInstance) return ioInstance;

//   ioInstance = new Server(server, {
//     cors: { origin: "*", methods: ["GET","POST"] } // restrict origin in production
//   });

//   ioInstance.on("connection", (socket) => {
//     console.log("✅ Socket connected:", socket.id);

//     // Join a room for a user (frontend should emit 'join' with userId)
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

// module.exports = { initSocket, getIO };
const { Server } = require("socket.io");

let ioInstance = null;

function initSocket(server) {
  if (ioInstance) return ioInstance;

  ioInstance = new Server(server, {
    cors: { origin: "*", methods: ["GET","POST"] } // allow frontend
  });

  ioInstance.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    // Join a room for a user (frontend emits 'join' with userId)
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room ${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return ioInstance;
}

function getIO() {
  if (!ioInstance) throw new Error("Socket.io not initialized. Call initSocket(server) first.");
  return ioInstance;
}

module.exports = { initSocket, getIO };
