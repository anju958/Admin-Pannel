
// const mongoose = require("mongoose");

// const invoiceSchema = new mongoose.Schema({
//   clientId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientLeads", required: true },
//   clientEmail: { type: String, required: true },
//   clientName: { type: String, required: true },
//   projects: [
//     {
//       name: String,
//       amount: Number,
//     },
//   ],
//   invoiceNumber: { type: String, unique: true },
//   totalAmount: { type: Number, required: true },
//   paidAmount: { type: Number, default: 0 },
//   status: { type: String, enum: ["Pending", "Partial", "Paid"], default: "Pending" },
//   remainingAmount: { type: Number, default: 0 },
//   dueDate: Date,
//   date: { type: Date, default: Date.now },
//   paidAt: Date,
// });

// module.exports = mongoose.model("Invoice", invoiceSchema);

const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientLeads", required: true },
  clientEmail: { type: String, required: true },
  clientName: { type: String, required: true },
  projects: [
    {
      name: String,
      amount: Number,
    },
  ],
  invoiceNumber: { type: String, unique: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  status: { type: String, enum: ["Pending", "Partial", "Paid", "Draft"], default: "Pending" },
  remainingAmount: { type: Number, default: 0 },
  dueDate: Date,
  date: { type: Date, default: Date.now },
  paidAt: Date,

  // ✅ New fields
  sentFrom: { type: String }, // which email sent
  isDraft: { type: Boolean, default: false }, // if invoice saved but not sent yet
});

module.exports = mongoose.model("Invoice", invoiceSchema);
