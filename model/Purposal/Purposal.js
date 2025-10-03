const mongoose = require("mongoose");
const Counter = require('../Counter/Counter');

const ProposalSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientLeads", required: true },
  title: String,
  services: [
   {
      id: String,
      name: String,
      price: Number
    }
  ],
  description: String,
  category: [{ type: String }],
  price: Number,
  terms: String,
  status: { type: String, enum: ["Draft", "Sent", "Accepted", "Rejected"], default: "Draft" },
 
  attachments: [String], 
  clientResponse: { type: String, default: "" },
  purposalId:{
    type:String
  }
},{ timestamps: true });
ProposalSchema.pre('save', async function (next) {
  if (!this.isNew || this.purposalId) return next();

  try {
    const counter = await Counter.findOneAndUpdate(
      { _id: 'purposalId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const year = new Date().getFullYear();
    const seqNum = String(counter.seq).padStart(5, '0');
    this.purposalId = `ID${year}-${seqNum}`;

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Proposal", ProposalSchema);
