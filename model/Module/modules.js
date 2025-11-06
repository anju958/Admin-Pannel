const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  _id: { type: String, required: true },        // e.g., 'invoices', 'projects'
  label: { type: String, required: true },      // e.g., 'Invoices'
  actions: [{ type: String }]                   // e.g., ['Add', 'Edit', 'View', 'Delete']
});

module.exports = mongoose.model('Module', ModuleSchema, 'modules');
