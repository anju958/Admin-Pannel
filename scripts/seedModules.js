const mongoose = require("mongoose");
const Module = require("../models/Module");

mongoose.connect(process.env.MONGO_URL);

const modules = [
  { key: "jobOpenings", label: "Job Openings", actions: ["View","Add","Edit","Delete"] },
  { key: "employees", label: "Employees", actions: ["View","Add","Edit","Delete"] },
  { key: "tasks", label: "Tasks", actions: ["View","Add","Edit","Delete"] },
  { key: "attendance", label: "Attendance", actions: ["View","Add","Edit"] },
  { key: "leads", label: "Leads", actions: ["View","Add"] }
];

Module.deleteMany({}).then(() => Module.insertMany(modules))
  .then(() => console.log("Modules seeded"))
  .finally(() => mongoose.disconnect());
