const mongoose = require('mongoose')
const Counter = require('../Counter/Counter')

const department = new mongoose.Schema({
    deptName: {
        type: String,
        required: false,
        unique: true
    },
    designation:
    {
        type: [String],
        default: []
    },
    deptId: { type: String, unique: true}
}, { timestamps: true })

department.pre('save', async function (next) {
    if (!this.isNew || this.deptId) return next();

    try {
        const counter = await Counter.findOneAndUpdate(
            { _id: 'deptId' },       
            { $inc: { seq: 1 } },       
            { new: true, upsert: true }  
        );
            const year = new Date().getFullYear(); 
        const seqNum = String(counter.seq).padStart(5, '0'); 
         this.deptId = `DEPT${year}-${seqNum}`;
        next();
    } catch (err) {
        next(err);
    }
});

const Department = mongoose.model('department', department);
module.exports = Department;