const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema({
  department: { type: String, required: true, unique: true },
  permissions: {
    jobOpening: {
      add: Boolean,
      edit: Boolean,
      view: Boolean,
      delete: Boolean,
    },
    employees: {
      add: Boolean,
      edit: Boolean,
      view: Boolean,
      delete: Boolean,
    },
    departmets: {
      add: Boolean,
      edit: Boolean,
      view: Boolean,
      delete: Boolean,
    },
    intern: {
      add: Boolean,
      edit: Boolean,
      view: Boolean,
      delete: Boolean,
    },
  },
});

module.exports = mongoose.model("Role", RoleSchema);
