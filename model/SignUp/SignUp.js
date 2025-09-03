const mongoose = require('mongoose')
const Counter = require('../Counter/Counter')

const PermissionSchema = new mongoose.Schema({
    module: { type: String, required: true }, 
    actions: {
        add: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        view: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
    }
}, { _id: false });

const SignUpSchema = new mongoose.Schema({
    ename: {
        type: String,
        required: false
    },
    dateOfBirth: {
        type: Date,
        
    },
    gender: {
        type: String,
        enum: ["male", "female"],
    },
    phoneNo: {
        type: String,
        unique: true

    },
    personal_email: {
        type: String,
        unique: true
    },
    official_email: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
    fatherName: {
        type: String
    },
    motherName: {
        type: String
    },
    address: {
        type: String
    },
    emergencyContact: {
        type: String
    },
    relation: {
        type: String
    },
    bankName: {
        type: String
    },
    accountNo: {
        type: String
    },
    ifscCode: {
        type: String
    },
    accountHolderName: {
        type: String
    },
    adarCardNo: {
        type: String
    },
    panNo: {
        type: String
    },
    qualification: {
        type: String
    },
    lastExp: {
        type: String
    },
    expWithPWT: {
        type: String
    },
    deptName: {
        type: String,
        required: false
    },
    designation: {
        type: String,
        required: false
    },
    interviewDate: {
        type: Date,
        required: false
    },
    joiningDate: {
        type: Date,
        required: false
    },
    expectedSalary: {
        type: Number,
        required: false
    },
    givenSalary: {
        type: Number,
        required: false
    },
    workingTime: {
        type: String
    },
    resumeFile: {
        type: String,
        required: false
    },
    userType: {
        type: String,
        enum: ["trainee", "employee", "intern"],
        lowercase: true,
        required: false
    },
    traineeDuration: {
        type: String
    },
    employeeId: { type: String, unique: true },

}, { timestamps: true });

SignUpSchema.pre('save', async function (next) {
    if (!this.isNew || this.employeeId) return next();

    try {
        const counter = await Counter.findOneAndUpdate(
            { _id: 'employeeId' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        const year = new Date().getFullYear();
        const seqNum = String(counter.seq).padStart(5, '0');
        this.employeeId = `Id${year}-${seqNum}`;
        next();
    } catch (err) {
        next(err);
    }
});

const SignUp = mongoose.model('SignUp', SignUpSchema);
module.exports = SignUp;