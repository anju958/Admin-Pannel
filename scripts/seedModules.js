const mongoose = require('mongoose');
require('dotenv').config();
const Module = require('../model/Module/modules'); 

const modules = [
  { _id: 'attendances', label: 'Attendances', actions: ['Add', 'Edit', 'View', 'Delete'] },
  { _id: 'clientleads', label: 'Client Leads', actions: ['Add', 'Edit', 'View', 'Delete'] },
  { _id: 'companies', label: 'Companies', actions: ['Add', 'Edit', 'View', 'Delete'] },
  { _id: 'departments', label: 'Departments', actions: ['Add', 'Edit', 'View', 'Delete'] },
  { _id: 'invoices', label: 'Invoices', actions: ['Add', 'Edit', 'View', 'Delete'] },
  { _id: 'jobopenings', label: 'Job Openings', actions: ['Add', 'Edit', 'View', 'Delete'] },
  { _id: 'leaves', label: 'Leaves', actions: ['Add', 'Edit', 'View', 'Delete'] },
  { _id: 'notices', label: 'Notices', actions: ['Add', 'Edit', 'View', 'Delete'] },
  { _id: 'notifications', label: 'Notifications', actions: ['Add', 'Edit', 'View', 'Delete'] },
  { _id: 'projects', label: 'Projects', actions: ['Add', 'Edit', 'View', 'Delete'] },
  { _id: 'proposals', label: 'Proposals', actions: ['Add', 'Edit', 'View', 'Delete'] },
  { _id: 'roles', label: 'Roles', actions: ['Add', 'Edit', 'View', 'Delete'] },
  { _id: 'salaries', label: 'Salaries', actions: ['Add', 'Edit', 'View', 'Delete'] },
  { _id: 'services', label: 'Services', actions: ['Add', 'Edit', 'View', 'Delete'] },
  { _id: 'signups', label: 'Signups', actions: ['Add', 'Edit', 'View', 'Delete'] },
  { _id: 'tasks', label: 'Tasks', actions: ['Add', 'Edit', 'View', 'Delete'] },
  { _id: 'users', label: 'Users', actions: ['Add', 'Edit', 'View', 'Delete'] }
];


async function seed() {
  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await Module.deleteMany({});
  await Module.insertMany(modules);
  console.log('Seeded modules!');
  mongoose.disconnect();
}

seed();
