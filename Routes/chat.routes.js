const express = require("express");
const {
  sendMessage,
  getMessages,
  markAsRead,
  getAllChats,
  getChatUsers,
} = require("../controller/chat/chat.controller");


const router = express.Router();


module.exports = router;
