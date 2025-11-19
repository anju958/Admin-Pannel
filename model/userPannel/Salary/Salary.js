const mongoose = require('mongoose');

const SalarySchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'SignUp', required: true },

  month: { type: String, required: true },
  year: { type: Number, required: true },

  basicPay: { type: Number, required: true },

  totalPresent: { type: Number, default: 0 },
  totalAbsent: { type: Number, default: 0 },
  totalHalfDays: { type: Number, default: 0 },
  paidLeaves: { type: Number, default: 0 },
  unpaidLeaves: { type: Number, default: 0 },

  perDaySalary: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netPay: { type: Number, default: 0 },

  status: { type: String, enum: ['Paid','Pending'], default: 'Pending' }
});

module.exports = mongoose.model('Salary', SalarySchema);
