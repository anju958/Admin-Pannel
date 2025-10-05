const mongoose = require("mongoose");
const Counter = require('../Counter/Counter');

const taskSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientLeads", required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "projects", required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "service" }, 
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "department" },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "SignUp" }],
  title: { type: String, required: true },
  category: { type: String },
  startDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
   priority: { type: String, default: "Low" },
  status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
  description: { type: String },
  TaskId: { type: String }
  
},{ timestamps: true });
taskSchema.pre('save', async function (next) {
    if (!this.isNew || this.TaskId) return next();
    try {
        const counter = await Counter.findOneAndUpdate(
            { _id: 'TaskId' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        const year = new Date().getFullYear();
        const seqNum = String(counter.seq).padStart(5, '0');
        this.TaskId = `Task${year}-${seqNum}`;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("Task", taskSchema);
