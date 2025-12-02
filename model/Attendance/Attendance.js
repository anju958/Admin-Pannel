
// const mongoose = require('mongoose');

// const AttendanceSchema = new mongoose.Schema({
//   empId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "SignUp",
//     required: true
//   },
//   date: {
//     type: Date,
//     required: true
//   },
//   check_in: { type: String, default: null },
//   check_out: { type: String, default: null },
//   workingHours: { type: Number, default: 0 },

//   status: {
//     type: String,
//     enum: ["Present", "Absent", "Leave", "Half Day"],
//     default: "Present"
//   },

//   lastActive: { type: Date, default: null },

//   remark: { type: String, default: null }
// },
// { timestamps: true }
// );

// // Unique Index (emp per day)
// AttendanceSchema.index({ empId: 1, date: 1 }, { unique: true });

// // ✅ Correct model name
// module.exports = mongoose.model("Attendance", AttendanceSchema);
const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  empId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SignUp",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  check_in: { type: String, default: null },  // "HH:mm:ss" string (or change to Date if preferred)
  check_out: { type: String, default: null },
  workingHours: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ["Present", "Absent", "Leave", "Half Day", "Holiday"],
    default: "Present"
  },

  lastActive: { type: Date, default: null },

  remark: { type: String, default: null },

  // New bookkeeping fields
  isLateMinutes: { type: Number, default: 0 },       // integer minutes late (after grace)
  isAutoMarkedAbsent: { type: Boolean, default: false },
  deductedHours: { type: Number, default: 0 },       // fractional hours deducted (late)
  deductionAmount: { type: Number, default: 0 }      // currency amount deducted for this day
},
{ timestamps: true }
);

// Unique Index (emp per day)
AttendanceSchema.index({ empId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
