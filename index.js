
const mongoose = require('mongoose')
const http = require("http");
const { initSocket } = require("./socket");
const cors = require('cors')
const express = require('express')
require('dotenv').config();
const path = require('path')

// <<<<<<< HEAD
const app = express()
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "controller/uploads")));

const Router = require('./Routes/Routes')

const PORT = process.env.PORT || 5000;
const URL = process.env.MONGO_URL;

// MongoDB Connection
mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB is connected'))
  .catch((err) => console.log('❌ Server Error', err));

// --- API ROUTES ---
app.use('/api', Router);


app.get("/", (req, res) => {
  res.send("✅ Backend is live on Render!");
});
const server = http.createServer(app);
const io = initSocket(server);
app.set("io", io); 



server.listen(PORT, () => {
  console.log(`🚀 Server + Socket running on port ${PORT}`);
});
