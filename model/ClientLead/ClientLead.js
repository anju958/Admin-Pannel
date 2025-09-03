const mongoose = require('mongoose');
const Counter = require('../Counter/Counter');

const ClientLeadSchema = new mongoose.Schema({
    leadName: {
        type: String,
        required: true
    },
    emailId: {
        type: String,
        required: true
    },
    phoneNo: {
        type: String,
        required: true
    },
    sourse: {
        type: String
    },
    service: {
        type: String
    },
    project_type: {
        type: String
    },
    project_price: {
        type: String
    },
    start_date: {
        type: Date
    },
    deadline: {
        type: Date
    },
    startProjectDate: {
        type: Date
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: "Pending"
    },
    assign: {
        type: String
    },
    userType: {
        type: String,
        enum: ["client", "lead"],
        required: true
    },
    leadId: {
        type: String,
        unique: true
    }
}, { timestamps: true });

ClientLeadSchema.pre('save', async function (next) {
    if (!this.isNew || this.leadId) return next();

    try {
        const counter = await Counter.findOneAndUpdate(
            { _id: 'leadId' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        const year = new Date().getFullYear();
        const seqNum = String(counter.seq).padStart(5, '0');
        this.leadId = `Id${year}-${seqNum}`;
        next();
    } catch (err) {
        next(err);
    }
});

const ClientLead = mongoose.model('ClientLead', ClientLeadSchema);
module.exports = ClientLead;
