const mongoose = require('mongoose')
const Counter = require('../../Counter/Counter')

const LeaveSchema = new mongoose.Schema({
    leave_type:{
        type:String,
    },
    from_date:{
        type:Date
    },
    to_date:{
        type:Date
    },
    reason:{
        type:String
    },
    leaveId:{
        type:String,
         unique: true
    }
},{ timestamps: true })
LeaveSchema.pre('save', async function (next) {
    if (!this.isNew || this.leaveId) return next();

    try {
        const counter = await Counter.findOneAndUpdate(
            { _id: 'leaveId' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        const year = new Date().getFullYear();
        const seqNum = String(counter.seq).padStart(5, '0');
        this.leaveId = `Id${year}-${seqNum}`;
        next();
    } catch (err) {
        next(err);
    }
});

const Leaves = mongoose.model('leaves', LeaveSchema);
module.exports = Leaves;
