
const Counter = require('../Counter/Counter')
const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "SignUp", required: true }, // employee
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" }, // optional link to task
    message: { type: String, required: true }, // notification text
    read: { type: Boolean, default: false }, 
    NotificationId:{
        type: String, unique: true 
    }
  },
  { timestamps: true }
);

NotificationSchema.pre('save', async function (next) {
    if (!this.isNew || this.NotificationId) return next();

    try {
        const counter = await Counter.findOneAndUpdate(
            { _id: 'NotificationId' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        const year = new Date().getFullYear();
        const seqNum = String(counter.seq).padStart(5, '0');
        this.NotificationId = `ID${year}-${seqNum}`;
        next();
    } catch (err) {
        next(err);
    }
});
const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;
