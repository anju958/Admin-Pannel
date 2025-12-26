  const mongoose = require('mongoose');
  const http = require("http");
  const { initSocket } = require("./socket");
  const cors = require('cors');
  const express = require('express');
  require('dotenv').config();
  require("./cronJobs/monthlySalaryCron");
  require("./cronJobs/autoAbsentCron");
  require("./cronJobs/autoLeaveMarkCron");
const notificationRoutes = require("./Routes/notificationRoutes");

  const path = require('path');
  const chatRoutes = require("./Routes/chat.routes");

  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.join(process.cwd(), "controller/uploads")));

  const Router = require('./Routes/Routes');
  app.use("/api/notifications", notificationRoutes);

  const PORT = process.env.PORT || 5000;
  const URL = process.env.MONGO_URL;

  // MongoDB Connection
  mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ MongoDB is connected'))
    .catch((err) => console.log('❌ Server Error', err));
    require('./cronJobs/attendanceCron')

  // Routes
  app.use('/api', Router);

  app.use("/api/chat", chatRoutes);


  app.get("/", (req, res) => {
    res.send("✅ Backend is live and socket is running!");
  });

  // Create HTTP server (required for socket.io)
  const server = http.createServer(app);

  // Initialize Socket.IO
  initSocket(server);

  // Start server
  server.listen(PORT, () => {
    console.log(`🚀 Server + Socket running on port ${PORT}`);
  });
