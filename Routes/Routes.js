
const express = require("express");
const uploadTo = require("../controller/middleware/multer");

const { SignUpController, getEmployeesByService } = require("../controller/SignUp/SignUp");
const { LoginAdmin } = require("../controller/Login/Login");
const { getEmployeeData } = require("../controller/Employee/getEmployee");
const { addDepartment, getDepartments, updateDepartment, getDepartmentByid, deleteDepartment } = require("../controller/DepartmentName/DepartmentName");
const { Job_Opening, get_JobOpening, DeleteJob } = require("../controller/Job_Opening/JobOpening");
const { job_data } = require("../Update_job_no/Update_job_no");
const {  getTraineeData } = require("../controller/Employee/getTraniee");
const { updateUser, deleteUser } = require("../controller/SignUp/SignUpDelandUpdate");
const { UpdateType } = require("../controller/SignUp/UpdateUserType");
const { Get_ClientLead, Gen_ClientLead, deleteLead, getLeadById } = require("../controller/ClientLead/ClientLeadData");
const { Get_Lead, Get_Client, getClientLeadById } = require("../controller/ClientLead/getClient");
const { updateVacancy } = require("../controller/Job_Opening/UpdateJob");
const { getEmpdatabyID, getEmployeesByDepartment } = require("../controller/Employee/getEmpbyId");
const { ConvertToClient, updateStatus } = require("../controller/ClientLead/ConverttoClient");
const { updateClientUser, deleteClientUser } = require("../controller/ClientLead/UpdateClientLead");
const { add_attendance, getAttendance } = require("../controller/Attendance/Attendance");
const { UserLogin } = require("../controller/UserLogin/UserLogin");
const { add_leave, get_leaves } = require("../controller/User/Leave/Leave");
const { addService, getAllServices, getServicesByDept, deleteService, updateService, getServicebyId, getServiceByProject } = require("../controller/Service/Service");
const { createProject, getProject, getProjectById, getProjectsByClient, getProjectByProjectId, updateProject, deleteProject, getServicebyProjectId, getAssignEmpByService, getEmployeesByProjectId, getProjectDetailById } = require("../controller/Projects/Projects");
const { getServicebyDepartment } = require("../controller/DepartmentServiceAPI/getDepartmentService");
const { createAndSendProposal, upload, getAllProposals, updateProposal, getProposalById, deleteProposal, approveProposal } = require("../controller/Purposal/Purposal");
const { addTask, getAllTasks, updateTask, deleteTask } = require("../controller/Task/Task");
const { notifyTask } = require("../controller/Notification/NotifyTask");
const { sendNotification, getNotifications, markAsRead, getAllNotifications, deleteNotice } = require("../controller/Notification/Notification");
const router = require("./Roles");
const { updateCompany, createCompany, getCompany } = require("../controller/CompanyDetails/CompanyDetails");

// const { createInvoice, markInvoicePaid } = require("../controller/Payment/PaymentController");


const {getAllInvoices, getInvoiceById, deleteInvoice ,createInvoice , markInvoicePaid} = require('../controller/Invoice/Invoice');
const { getReportsSummary } = require("../controller/Reports/Reports");
const { getAdminSummary } = require("../controller/Summary/Summary");






const Router = express.Router();

// ---------- FILE UPLOAD ROUTES ----------
Router.post(
  "/signUp",
  uploadTo().fields([
    { name: "resumeFile", maxCount: 1 },
    { name: "img", maxCount: 1 },
  ]),
  SignUpController
);

Router.post("/proposals", upload.array("attachments"), createAndSendProposal );
Router.put('/UpdateProposal/:id', upload.array("attachments"),updateProposal)
Router.delete('/DeleteProposal/:id',deleteProposal)
Router.get('/getProposalById/:id',getProposalById)

Router.get('/getAllProposal' , getAllProposals)


Router.post("/addProject", uploadTo().single("addFile"), createProject);

Router.put(
  "/updateSignUser/:employeeId",
  uploadTo().fields([
    { name: "resumeFile", maxCount: 1 },
    { name: "img", maxCount: 1 },
  ]),
  updateUser
)

//Reports
Router.get('/reports/summary',getReportsSummary)

//Invoice Routes
Router.get('/getAllInvoices', getAllInvoices );
Router.get('/getInvoiceById/:id',getInvoiceById);
Router.put('/markpaid/:id',markInvoicePaid);
Router.delete('/deleteInvoice/:id', deleteInvoice)


Router.patch('/approvalproposal/:id' , approveProposal)


Router.post("/createInvoice", createInvoice);

Router.get('/AdminSummary/',getAdminSummary)

// ---------- NORMAL ROUTES ----------

Router.use('/roles',router)

Router.get("/getEmployeeByService/:serviceId", getEmployeesByService);
Router.post("/adminLogin", LoginAdmin);
Router.get("/getemployeeData", getEmployeeData);
Router.post("/addDepartment", addDepartment);
Router.get("/getDepartment", getDepartments);
Router.get('/getEmployeeByDepartment/:deptId',getEmployeesByDepartment)
Router.get("/getServicebyDepartment/:deptId", getServicebyDepartment);
Router.post("/addJob", Job_Opening);
Router.delete('/deleteJob/:id',DeleteJob)
Router.get("/get_Jobs", get_JobOpening);
Router.put('/updateDepartment/:id',updateDepartment)
Router.delete('/deleteDepartment/:id', deleteDepartment)
Router.get('/getDepartmentById/:id',getDepartmentByid)
Router.post("/addService", addService);
Router.get("/getServices", getAllServices);
Router.get('/getServiceById/:id',getServicebyId)
Router.get("/serviceById/:deptId", getServicesByDept);
Router.delete('/deleteService/:id',deleteService)
Router.put('/UpdateService/:id',updateService)
Router.get("/getProjects", getProject);
Router.put('/updateProject/:id',updateProject)
Router.get("/getProjectById/:clientId/:projectId", getProjectById);
Router.delete('/deleteProjectById/:id' , deleteProject)
Router.post("/createInvoice/:clientId", createInvoice);
Router.get("/getProjectbyClient/:clientId", getProjectsByClient);
Router.get('/getprojectByPorjectId/:projectId',getProjectByProjectId)
Router.get("/getjobvacancy", job_data);

//Task api
Router.post('/addTask',addTask)

Router.get('/getTraineeData',getTraineeData)
Router.delete("/deleteSignUpUser/:employeeId", deleteUser);
Router.put("/movetoemployee/:employeeId", UpdateType);
Router.post("/genClientLead", Gen_ClientLead);
Router.get("/getClientLead", Get_ClientLead);

//Notification
Router.post('/notifyTask', notifyTask)
Router.delete('/deleteTask/:id',deleteTask)


//notification 

Router.post('/sendNotification', sendNotification)
Router.put('/read/:notificationId' , markAsRead)
Router.get('/getAllNotifications',getAllNotifications)
Router.delete('/deleteNotice/:id' ,  deleteNotice)


Router.get('/getServices/:projectId' ,getServiceByProject)
Router.get('/getProjectDetails/:projectId',getProjectDetailById);
Router.get('/getAllTasks',getAllTasks)
Router.get('/getEmployeeByProject/:projectId',getEmployeesByProjectId)

Router.get('/leadById/:id',getLeadById)

Router.put('/updateStatus/:id',updateStatus)

//company details 
Router.post('/companyDetails', createCompany)
Router.get('/getCompnayDetails' , getCompany)
Router.put('/updateCompnay/:id',updateCompany)

Router.put('/UpdateTask/:id',updateTask)
Router.get("/getLeadData", Get_Lead);
Router.get("/getClientData", Get_Client);

Router.put("/updateVacancy/:jobId", updateVacancy);
Router.get("/getEmpDataByID/:employeeId", getEmpdatabyID);
Router.put("/moveleadtoClient/:leadId", ConvertToClient);
Router.delete("/DeleteLead/:leadId", deleteLead);
Router.put("/updateClientLead/:leadId", updateClientUser);
Router.delete("/deleteClientLead/:leadId", deleteClientUser);
Router.get("/getClientLeadbyId/:leadId", getClientLeadById);


Router.post("/add_attendance", add_attendance);
Router.get("/get_attendance", getAttendance);


Router.post("/userLogin", UserLogin);
Router.post("/addLeave", add_leave);
Router.get("/getLeave", get_leaves);

module.exports = Router;
