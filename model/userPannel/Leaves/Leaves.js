

const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "SignUp", required: true },
  leave_type: { type: String, required: true },
  from_date: { type: Date, required: true },
  to_date: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  days: { type: Number },
  leaveId: { type: String }
}, { timestamps: true });

module.exports = mongoose.models.leave || mongoose.model("leave", LeaveSchema);
