// models/Salary.js

const mongoose = require('mongoose');

const SalarySchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  basicPay: { type: Number, required: true },
  allowances: { type: Number, required: true },
  deductions: { type: Number, required: true },
  netPay: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' }
});

module.exports = mongoose.model('Salary', SalarySchema);
