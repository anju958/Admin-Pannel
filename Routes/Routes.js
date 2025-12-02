
  const express = require("express");
  const uploadTo = require("../controller/middleware/multer");
  const multer = require("multer");

  const commentStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/comments/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    }
  });

  const uploadComment = multer({ storage: commentStorage });


  const { SignUpController, getEmployeesByService } = require("../controller/SignUp/SignUp");
  const { LoginAdmin } = require("../controller/Login/Login");
  const { getEmployeeData } = require("../controller/Employee/getEmployee");
  const { addDepartment, getDepartments, updateDepartment, getDepartmentByid, deleteDepartment } = require("../controller/DepartmentName/DepartmentName");
  const { Job_Opening, get_JobOpening, DeleteJob } = require("../controller/Job_Opening/JobOpening");
  const { job_data } = require("../Update_job_no/Update_job_no");
  const {  getTraineeData } = require("../controller/Employee/getTraniee");
  const { updateUser, deleteUser } = require("../controller/SignUp/SignUpDelandUpdate");
  const { UpdateType, getAllEmployees, deleteEmployee } = require("../controller/SignUp/UpdateUserType");
  const { Get_ClientLead, Gen_ClientLead, deleteLead, getLeadById, sendPasswordSetupOtp, createPassword, clientLogin } = require("../controller/ClientLead/ClientLeadData");
  const { Get_Lead, Get_Client, getClientLeadById } = require("../controller/ClientLead/getClient");
  const { updateVacancy } = require("../controller/Job_Opening/UpdateJob");
  const { getEmpdatabyID, getEmployeesByDepartment } = require("../controller/Employee/getEmpbyId");
  const { ConvertToClient, updateStatus } = require("../controller/ClientLead/ConverttoClient");
  const { updateClientUser, deleteClientUser } = require("../controller/ClientLead/UpdateClientLead");
  const {  getMonthlyAttendance, getTodayAttendance, logoutEmployee, getMonthlyAttendanceByAdmin, adminUpdateOfficeTiming } = require("../controller/Attendance/Attendance");
  const { UserLogin, UserLogout, getWorkingHours, forgotPassword, resetUserPassword } = require("../controller/UserLogin/UserLogin");
  const { add_leave, get_leaves, getLeaves } = require("../controller/User/Leave/Leave");
  const { addService, getAllServices, getServicesByDept, deleteService, updateService, getServicebyId, getServiceByProject } = require("../controller/Service/Service");
  const { createProject, getProject, getProjectById, getProjectsByClient, getProjectByProjectId, updateProject, deleteProject, getServicebyProjectId, getAssignEmpByService, getEmployeesByProjectId, getProjectDetailById } = require("../controller/Projects/Projects");
  const { getServicebyDepartment } = require("../controller/DepartmentServiceAPI/getDepartmentService");
  const { createAndSendProposal, upload, getAllProposals, updateProposal, getProposalById, deleteProposal, approveProposal } = require("../controller/Purposal/Purposal");

  const { notifyTask } = require("../controller/Notification/NotifyTask");
  const { sendNotification, getNotifications, markAsRead, getAllNotifications, deleteNotice } = require("../controller/Notification/Notification");
  const router = require("./Roles");
  const { updateCompany, createCompany, getCompany } = require("../controller/CompanyDetails/CompanyDetails");

  // const { createInvoice, markInvoicePaid } = require("../controller/Payment/PaymentController");


  const {getAllInvoices, getInvoiceById, deleteInvoice ,createInvoice , markInvoicePaid, getInvoicesByClient, addPayment} = require('../controller/Invoice/Invoice');
  const { getReportsSummary } = require("../controller/Reports/Reports");
  const { getAdminSummary } = require("../controller/Summary/Summary");
  const { getAllLeaves, getMonthlyAcceptedLeaves, addLeave, updateLeaveStatus, getAllLeavesAdmin } = require("../controller/UserPannel/Leaves/Leaves");
  const { getSalaryStats, getSalaryDetails } = require("../controller/User/Salary/Salary");
  const { getTasksByEmployee } = require("../controller/User/TaskAssign/TaskAssign");
  const { getEmployeeStats } = require("../model/userPannel/HomePage/HomePage");
  const { updateSelfProfile, getEmployeeById } = require("../controller/SignUp/UpdateEmplyeeSelf");
  // const { registerUser, loginUser, getAllUsers } = require("../controller/authController/authController");
  // const { createUser } = require("../controller/userController/userController");
  const { requireSuperAdmin } = require("../controller/middleware/auth");
  const jwt = require('jsonwebtoken');
  const User = require('../model/Users/Users');
  const { createUser, updatePermission, getAllAdminUsers, getAdminUserById, deleteAdminUserById, resetPassword ,  } = require("../controller/userController/userController");
  const normalizeInput = require("../controller/middleware/normalizeInput");
  const { getModules } = require("../controller/Module/modules");
  

  const taskRoutes = require("./Task/taskRoutes");
  const { getClientDashboardSummary } = require("../controller/clientDashboard/clientHome/clientSummary");
  const { getClientProjects, getClientProject, getClientProposals, getClientProposal, getClientProfile, updateClientProfile, getClientTasks, getClientTask } = require("../controller/clientDashboard/clientHome/clientDashboardExtras");
const { createHoliday, getAllHolidays, deleteHoliday } = require("../controller/Holiday/holidayController");
const { getSalaryByMonth, generateSalary, regenSalary, getSalaryHistory, requestAccess, approveAccess, getAllSalaries, bulkRegenerate, regenerateSalary, markSalaryPaid, getAllEmployeesWithSalary, adminGetAllSalary, getAllEmployeeSalary}= require('../controller/UserPannel/salary/salary')




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


  Router.put("/updateSelfId/:id",uploadTo().fields([
    { name: "img", maxCount: 1 },
      { name: "resumeFile", maxCount: 1 },
  ]),updateSelfProfile

  )


  Router.get('/getAllEmployees',getAllEmployees)
  Router.delete('/deleteEmp/:id',deleteEmployee)
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


  Router.get("/getEmplyeeById/:id",getEmployeeById)
  //Reports
  Router.get('/reports/summary',getReportsSummary)

  //Invoice Routes
  Router.get('/getAllInvoices', getAllInvoices );
  Router.get('/getInvoiceById/:id',getInvoiceById);
  Router.put('/markpaid/:id',markInvoicePaid);
  Router.get('/getInvoicesByClient/:clientId',getInvoicesByClient)
  Router.delete('/deleteInvoice/:id', deleteInvoice)
  Router.post('/invoices/:id/addPayment',addPayment)

  Router.patch('/approvalproposal/:id' , approveProposal)


  Router.post("/createInvoice", createInvoice);

  Router.get('/AdminSummary/',getAdminSummary)



  Router.get("/getEmployeeByService/:serviceId", getEmployeesByService);
  Router.post("/adminLogin", normalizeInput ,LoginAdmin);
  Router.get('/users/me', async (req, res) => {
    try {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }
      const token = auth.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).lean();
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user });
    } catch (err) {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  //create user by admin routes
  Router.post('/users/create', normalizeInput,createUser)
  Router.put('/users/update/:id', updatePermission)
  Router.get('/getAllAdminUser', getAllAdminUsers)
  Router.get('/getAdminbyUsers/:id', getAdminUserById)
  Router.delete('/deleteAdminByUser/:id' , deleteAdminUserById)
  Router.put('/users/:id',resetPassword)

  //permission
  Router.get('/getModule',getModules)


  //login  and logout employee page
  // Router.post('/employee/login',UserLogin)
  Router.post('/employee/logout' , UserLogout)
  Router.get('/employee/working-hours',getWorkingHours)

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
  // Router.post("/createInvoice/:clientId", createInvoice);
  Router.get("/getProjectbyClient/:clientId", getProjectsByClient);
  Router.get('/getprojectByPorjectId/:projectId',getProjectByProjectId)
  Router.get("/getjobvacancy", job_data);

  //Task api


  Router.get('/getTraineeData',getTraineeData)
  Router.delete("/deleteSignUpUser/:employeeId", deleteUser);
  Router.put("/movetoemployee/:employeeId", UpdateType);
  Router.post("/genClientLead", Gen_ClientLead);
  Router.get("/getClientLead", Get_ClientLead);

  //Notification
  Router.post('/notifyTask', notifyTask)



  //notification 

  Router.post('/sendNotification', sendNotification)
  Router.put('/read/:notificationId' , markAsRead)
  Router.get('/getAllNotifications',getAllNotifications)
  Router.delete('/deleteNotice/:id' ,  deleteNotice)


  Router.get('/getServices/:projectId' ,getServiceByProject)
  Router.get('/getProjectDetails/:projectId',getProjectDetailById);

  Router.get('/getEmployeeByProject/:projectId',getEmployeesByProjectId)

  Router.get('/leadById/:id',getLeadById)

  Router.put('/updateStatus/:id',updateStatus)

  //permission
  // Router.post('/user/create', requireSuperAdmin, createUser)

  //company details 
  // Router.post('/companyDetails', createCompany)
  // Router.get('/getCompnayDetails' , getCompany)
  // Router.put('/updateCompnay/:id',updateCompany)


  Router.get("/getLeadData", Get_Lead);
  Router.get("/getClientData", Get_Client);

  Router.put("/updateVacancy/:jobId", updateVacancy);

  Router.get("/getEmpDataByID/:employeeId", getEmpdatabyID);

  //client routes
  Router.put("/moveleadtoClient/:leadId", ConvertToClient);
  Router.delete("/DeleteLead/:leadId", deleteLead);
  Router.put("/updateClientLead/:leadId", updateClientUser);
  Router.delete("/deleteClientLead/:leadId", deleteClientUser);
  Router.get("/getClientLeadbyId/:leadId", getClientLeadById);
  Router.post('/client/send-password-otp',sendPasswordSetupOtp);
  Router.post('/client/create-password',createPassword)
  Router.post('/clientLogin', clientLogin)


  //leaves routes wor
  Router.post('/addLeave', addLeave)

  Router.get('/getLeave', getLeaves)
  Router.get('/getAllLeaves/:employeeId', getAllLeaves)
  Router.get('/admin/getAllLeave', getAllLeavesAdmin)
  // Router.get('/getMonthlyAcceptedLeaves/:employeeId',getMonthlyAcceptedLeaves)
  Router.put('/admin/updateLeaveStatus/:leaveId', updateLeaveStatus)

  // Router.get('/getTotalProjects/:employeeId', getTotalProjects)


  Router.get('/getSalaryStats/:employeeId/:month/:year',getSalaryStats)
  Router.get('/getSalaryDetails/:employeeId',getSalaryDetails)


  Router.post("/userLogin", UserLogin);
  
  Router.get('/getTasksByEmployee/:employeeId', getTasksByEmployee)

  Router.get('/employeeStats/:employeeId',getEmployeeStats)

  //forget password 
  Router.post("/forget-password", forgotPassword)
  // Router.post('/reset-password/:token',resetEmployeePassword)
  Router.post("/reset-password/:token", resetUserPassword)


  //attandance
  Router.get('/monthly' , getMonthlyAttendance)
  Router.get('/today',getTodayAttendance)
  // Router.post('/logout' ,logoutEmployee)
  Router.post("/checkout", async (req, res) => {
    try {
      const { employeeId } = req.body;
      await markAttendanceCheckOut(employeeId);
      res.json({ message: "Checkout updated" });
    } catch (err) {
      res.status(500).json({ error: err.message });

    }
  });
  Router.get('/getMonthlyAttandenceByAdmin', getMonthlyAttendanceByAdmin )



  //salary routes
  // Router.post('/generate-salary/:empId',generateSalary)
  // Router.post('/regen-salary/:empId' , regenSalary)
  Router.use("/tasks", taskRoutes);

  //client Routes
  Router.get('/client/dashboard/:clientId',getClientDashboardSummary)
  Router.get('/client/client-projects/:clientId',getClientProjects)
  Router.get('/client/client-project/:projectId',getClientProject)
  Router.get('/client/client-proposals/:clientId',getClientProposals)
  Router.get('/client/client-proposal/:proposalId',getClientProposal)

  Router.get('/client/profile/:clientId',getClientProfile)
  Router.put('/client/profile/:clientId',updateClientProfile)

  Router.get('/client/client-tasks/:clientId',getClientTasks)
  Router.get('/client/client-task/:taskId',getClientTask)


  // Protect with admin middleware
  Router.post('/holiday',createHoliday)
  Router.get('/holiday',getAllHolidays)
  Router.delete('/holiday/:id',deleteHoliday)


  // Update employee office timing (admin)
  Router.put('/updateOfficeTiming/:employeeId',adminUpdateOfficeTiming)
  // Router.post('/bulkUpdateOfficeTiming',bulkUpdateOfficeTiming)

//Salary api
Router.get('/month/:empId', getSalaryByMonth)
Router.post('/generateSalary/:empId',generateSalary);
Router.post('/regenSalary/:empId', regenSalary);
Router.get('/salaryhistory/:empId', getSalaryHistory)

Router.post('/salary/requestAccess',requestAccess);
Router.put('/salary/approveAccess/:requestId',approveAccess)


//admin routes 
Router.get('/salary/all/sal' , getAllSalaries);
Router.put('/salary/regen/bulk', bulkRegenerate);
Router.put('/salary/regen/:empId',regenerateSalary)
Router.get('/salary/all',getAllEmployeeSalary)
Router.put('/salary/update/:id',markSalaryPaid)
Router.get('/salary/employee-wise',getAllEmployeesWithSalary)
Router.get('/salary/all/getsalary',adminGetAllSalary)


  module.exports = Router;
