
const mongoose = require('mongoose')
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

const Router = require('../backend/Routes/Routes')

const PORT = process.env.PORT || 5000;
const URL = process.env.MONGO_URL;

// MongoDB Connection
mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB is connected'))
  .catch((err) => console.log('❌ Server Error', err));

// --- API ROUTES ---
app.use('/api', Router);

// --- Serve React frontend only for non-API routes ---
const frontendPath = path.resolve(__dirname, "../frontend/build");
app.use(express.static(frontendPath));

// Only match non-API routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

//     app.use('/api/',Router)
//     app.get('/', (req, res) => {
//     res.send('Backend is live!');
// });

//     app.listen(PORT,()=>{
//          console.log(` Server running on port ${PORT}`);
//     })
// >>>>>>> 7a6c921f925aec7416754c1fcc3ad03ad6c683f5
