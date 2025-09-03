const mongoose = require('mongoose')
const Counter = require('../Counter/Counter')

const AttendanceSchema = new mongoose.Schema({
    empId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SignUp",
        required: true 
    },
    date: {
        type: Date,
        default: Date.now,
    },
    check_in: {
        type: String

    },
    check_out: {
        type: String
    },
    status: {
        type: String, enum: ["Present", "Absent", "Leave"], default: "Present"
    },
    remark: {
        type: String
    },
    attendanceId: { type: String, unique: true }

 } ,{ timestamps: true })
AttendanceSchema.index({ empId: 1, date: 1 }, { unique: true });

const attendancee=mongoose.model('attendance',AttendanceSchema);
module.exports = attendancee;
