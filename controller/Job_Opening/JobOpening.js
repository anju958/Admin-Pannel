const JobOpening = require('../../model/JobOpening/JobOpening')
const JobOpeningNotification = require('../../model/Notification/JobOpeningNotification')
const Department = require("../../model/Department/AddDepartment");
const Service = require("../../model/Services/Service");
const createRoleBasedNotification = require(
  "../../utils/createRoleBasedNotification"
);
  

const Job_Opening = async (req, res) => {
  try {
    // 🔐 Ensure auth
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      department,
      service,
      no_of_Opening,
      selected_emp,
      mini_salary,
      max_salary,
      skills,
      job_des,
      job_type,
      opend_Date,
      close_date
    } = req.body;

    // 1️⃣ Create Job
    const new_job = new JobOpening({
      department,
      service,
      no_of_Opening,
      selected_emp,
      mini_salary,
      max_salary,
      skills,
      job_des,
      job_type,
      opend_Date,
      close_date,
    });

    const save_job = await new_job.save();

    // 2️⃣ Get department & service names
    const departmentData = await Department.findById(department).select("deptName");
    const serviceData = await Service.findById(service).select("serviceName");

    const departmentName = departmentData?.deptName || "Department";
    const serviceName = serviceData?.serviceName || "Service";

    // 🔔 ROLE-BASED NOTIFICATION (NEW SYSTEM)
    await createRoleBasedNotification({
      type: "JOB_CREATED",
      title: `New Job Opened – ${departmentName} / ${serviceName}`,
      message: `Vacancy: ${no_of_Opening} position(s) available`,
      module: "job",
      refId: save_job._id,
      actorUserId: req.user.id,               // JWT id
      actorRole: req.user.role.toLowerCase(), // normalized role
    });

    return res.status(200).json({
      message: "Job added successfully",
      data: save_job,
    });

  } catch (error) {
    console.error("Job Opening Error:", error);
    res.status(500).json({ message: error.message });
  }
};




const get_JobOpening = async (req, res) => {
  try {
    const getData = await JobOpening.find()
      .populate("department", "deptName")
      .populate("service", "serviceName")
      .sort({ createdAt: -1 });

    res.status(200).json(getData);
  } catch (error) {
    res.status(500).json({ message: "Error Fetching jobs", error: error });
  }
};


const DeleteJob = async (req, res) => {
  try {
    // 🔐 Ensure auth
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const jobId = req.params.id;

    const deletedJob = await JobOpening.findByIdAndDelete(jobId);

    if (!deletedJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    // 🔔 ROLE-BASED NOTIFICATION
    await createRoleBasedNotification({
      type: "JOB_DELETED",
      title: "Job Deleted",
      message: `A job opening was deleted by ${req.user.role}`,
      module: "job",
      refId: deletedJob._id,
      actorUserId: req.user.id,               // JWT id
      actorRole: req.user.role.toLowerCase(), // normalized
    });

    res.status(200).json({
      message: "Job deleted successfully",
      deletedJob,
    });

  } catch (error) {
    console.error("Delete Job Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = { Job_Opening, get_JobOpening, DeleteJob } 