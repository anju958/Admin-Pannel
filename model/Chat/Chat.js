const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },     // can be employeeId or Mongo _id
    receiverId: { type: String, required: true },   // same as above
    roomKey: { type: String, index: true },         // "smallId|bigId"
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ChatSchema.pre("save", function (next) {
  const s = String(this.senderId);
  const r = String(this.receiverId);
  this.roomKey = s < r ? `${s}|${r}` : `${r}|${s}`;
  next();
});

module.exports = mongoose.model("Chat", ChatSchema);
