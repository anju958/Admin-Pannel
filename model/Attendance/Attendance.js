

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
  check_in: String,
  check_out: String,
  status: {
    type: String,
    enum: ["Present", "Absent", "Leave", "Half Day"],
    default: "Present"
  },
  remark: String,
});

AttendanceSchema.index({ empId: 1, date: 1 }, { unique: true });

const attendancee = mongoose.model('attendance', AttendanceSchema);
module.exports = attendancee;
