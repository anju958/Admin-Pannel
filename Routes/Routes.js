 const express = require('express'); 
const uploads = require('../controller/middleware/multer')
const { SignUpController } = require('../controller/SignUp/SignUp');
const { LoginAdmin } = require('../controller/Login/Login');
const { getEmployeeData } = require('../controller/Employee/getEmployee');
const { Dept_Name, get_Dept, get_Dept_Name, get_designation } = require('../controller/Department_Name/DepartmentName');
const { Job_Opening, get_JobOpening } = require('../controller/Job_Opening/JobOpening');
const { job_data } = require('../Update_job_no/Update_job_no');
const { getTrainee } = require('../controller/Employee/getTraniee');
const {  updateUser, deleteUser } = require('../controller/SignUp/SignUpDelandUpdate');
const { UpdateType } = require('../controller/SignUp/UpdateUserType');
const {  Get_ClientLead, Gen_ClientLead, deleteLead } = require('../controller/ClientLead/ClientLeadData');
const { Get_Lead, Get_Client } = require('../controller/ClientLead/getClient');
const { updateVacancy } = require('../controller/Job_Opening/UpdateJob');
const { getEmpdatabyID } = require('../controller/Employee/getEmpbyId');
const { ConvertToClient } = require('../controller/ClientLead/ConverttoClient');
const { updateClientUser, deleteClientUser } = require('../controller/ClientLead/UpdateClientLead');
const { add_attendance, getAttendance } = require('../controller/Attendance/Attendance');
const { UserLogin } = require('../controller/UserLogin/UserLogin');
const Router=express.Router();

Router.post('/signUp', uploads.single('resumeFile'),SignUpController);
Router.post('/adminLogin',LoginAdmin);
Router.get('/getemployeeData',getEmployeeData)
Router.post('/add_department',Dept_Name);
Router.post('/addJob',Job_Opening)
Router.get('/get_Jobs',get_JobOpening)
Router.get('/get_Department',get_Dept)
Router.get('/getDepartmentNamee',get_Dept_Name)
Router.get('/getDesignation',get_designation)
Router.get('/getjobvacancy',job_data)
Router.get('/getTraniee',getTrainee)

Router.put('/updateSignUser/:employeeId', uploads.single("resumeFile"), updateUser)
Router.delete('/deleteSignUpUser/:employeeId',deleteUser)
Router.put('/movetoemployee/:employeeId', UpdateType)
Router.post('/genClientLead',Gen_ClientLead)
Router.get('/getClientLead' , Get_ClientLead)
Router.get('/getLeadData',Get_Lead)
Router.get('/getClientData' , Get_Client)
Router.put('/updateVacancy/:jobId',updateVacancy)
Router.get('/getEmpDataByID/:employeeId',getEmpdatabyID)
Router.put('/moveleadtoClient/:leadId',ConvertToClient)
Router.delete('/DeleteLead/:leadId' , deleteLead)
Router.put('/updateClientLead/:leadId' , updateClientUser)
Router.delete('/deleteClientLead/:leadId',deleteClientUser)
Router.post('/add_attendance',add_attendance)
Router.get('/get_attendance' , getAttendance)
Router.post('/userLogin',UserLogin)


module.exports = Router;