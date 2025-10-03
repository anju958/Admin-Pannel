
const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientLeads", required: true },
  clientEmail: { type: String, required: true },   // Added
  clientName: { type: String, required: true },    // Added
  projects: [
    {
      projectId: { type: mongoose.Schema.Types.ObjectId, ref: "projects" },
      amount: Number,
    }
  ],
  invoiceNumber: { type: String, unique: true },
  date: { type: Date, default: Date.now },
  dueDate: { type: Date },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Paid"], default: "Pending" },

  
  razorpayPaymentLinkId: { type: String },   // e.g. plink_xxx
  razorpayPaymentLink: { type: String },     // short_url (clickable URL)
  paymentId: { type: String },               // pay_xxx
  razorpaySignature: { type: String }, 
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
