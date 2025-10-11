const mongoose = require('mongoose')
const Counter = require('../Counter/Counter')

const SignUpSchema = new mongoose.Schema({
    ename: {
        type: String,
        required: false
    },
    dateOfBirth: {
        type: Date,
        validate: {
            validator: function (v) {
                if (!v) return false;
                const year = v.getFullYear();
                // allow only 1900–2100
                return year >= 1900 && year <= 2100;
            },
            message: props => `${props.value} is not a valid date!`
        }

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
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "department"
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "service"
    },
    interviewDate: {
        type: Date,
        required: false,
        validate: {
            validator: function (v) {
                if (!v) return false;
                const year = v.getFullYear();
                // allow only 1900–2100
                return year >= 1900 && year <= 2100;
            },
            message: props => `${props.value} is not a valid date!`
        }
    },
    joiningDate: {
        type: Date,
        required: false,
        validate: {
            validator: function (v) {
                if (!v) return false;
                const year = v.getFullYear();
                // allow only 1900–2100
                return year >= 1900 && year <= 2100;
            },
            message: props => `${props.value} is not a valid date!`
        }
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
    img: {
        type: String,
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
    fcmTokens: [{ type: String }],
    deviceTokens: [{ type: String }],

    notificationPreferences: {
        email: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
        push: { type: Boolean, default: false }
    },
    role: { type: String, enum: ["admin", "employee"], default: "employee" },
    isActive: { type: Boolean, default: true },
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