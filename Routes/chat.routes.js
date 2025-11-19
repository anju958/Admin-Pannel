const express = require("express");
const {
  sendMessage,
  getMessages,
  markAsRead,
  getAllChats,
  getChatUsers,
} = require("../controller/chat/chat.controller");

const { verifyToken } = require("../controller/middleware/auth"); // update path

const router = express.Router();

router.post("/send", verifyToken, sendMessage);
router.get("/messages", verifyToken, getMessages);
router.post("/mark-read", verifyToken, markAsRead);
router.get("/all", verifyToken, getAllChats);
router.get("/users", verifyToken, getChatUsers);

module.exports = router;
