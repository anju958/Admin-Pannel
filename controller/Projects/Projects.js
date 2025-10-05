
const Project = require('../../model/Project/Projects');
const SignUp = require('../../model/SignUp/SignUp'); 
const mongoose = require("mongoose");

// CREATE PROJECT
const createProject = async (req, res) => {
  try {
    console.log("req.file:", req.file); // uploaded file info
    console.log("req.body:", req.body); // form data

    const {
      projectName,
      department,
      service,
      price,
      startDate,
      endDate,
      projectCategory,
      notes,
      addMember,
      projectDescription,
      clientId
    } = req.body;

    // Create new project
    const newProject = new Project({
      projectName,
      department,
      service,
      price,
      startDate,
      endDate,
      projectCategory,
      notes,
      addMember: addMember ? JSON.parse(addMember) : [], // parse JSON array if sent
      projectDescription,
      clientId,
      addFile: req.file ? req.file.filename : null // save file name
    });

    await newProject.save();

    res.status(200).json({
      message: "Project Added Successfully",
      project: newProject
    });
  } catch (error) {
    console.error("Error in createProject:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// GET ALL PROJECTS
const getProject = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("clientId", "leadName")
      .populate("department", "deptName")
      .populate("service", "serviceName")
      .populate('addMember','ename')
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getProjectsByClient = async (req, res) => {
  try {
    const clientId = req.params.clientId;
      console.log("Client ID from params:", clientId);
    const isValidObjectId = mongoose.Types.ObjectId.isValid(clientId);


     const query = isValidObjectId
      ? { clientId: clientId }                         // Case: stored as ObjectId
      : { "clientId.leadId": clientId };              // Case: stored as leadId/string

    console.log("Query being used:", query); 



    const clientProjects = await Project.find(query)
      .populate("clientId", "leadName")
      .populate("department", "deptName")
      .populate("service", "serviceName")
      .populate("addMember", "ename") // populate employee names here
       .sort({ createdAt: -1 });
    res.status(200).json(clientProjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET PROJECT BY ID
const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate("clientId", "leadName")
      .populate("department", "deptName")
      .populate("service", "serviceName");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProjectByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Find project by its MongoDB _id
    const project = await Project.findById(projectId)
      .populate("clientId", "leadName email phone")   // only return selected client fields
      .populate("department", "deptName")
      .populate("service", "serviceName")
      .populate("addMember", "ename email");          // return assigned member names

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      projectName,
      department,
      service,
      price,
      startDate,
      endDate,
      projectCategory,
      notes,
      projectDescription,
      addMember,
    } = req.body;

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        projectName,
        department,
        service,
        price,
        startDate,
        endDate,
        projectCategory,
        notes,
        projectDescription,
        addMember,
      },
      { new: true, runValidators: true }
    )
      .populate("clientId", "leadName")
      .populate("department", "deptName")
      .populate("service", "serviceName")
      .populate("addMember", "ename email");

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Update Project Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Project.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }


};


const getEmployeesByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Find project by _id
    const project = await Project.findById(projectId)
      .populate("addMember", "ename official_email personal_email phoneNo userType department service");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.addMember || project.addMember.length === 0) {
      return res.status(200).json({
        message: "No employees assigned to this project",
        employees: []
      });
    }

    res.status(200).json({
      message: "Employees fetched successfully",
      projectName: project.projectName,
      employees: project.addMember
    });
  } catch (error) {
    console.error("Error fetching employees by project:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};

const getProjectDetailById = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Find project by _id
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({
      message: "Project details fetched successfully",
      projectCategory: project.projectCategory,
      startDate: project.startDate,
      endDate: project.endDate,
      projectName: project.projectName
    });
  } catch (error) {
    console.error("Error fetching project details:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};





module.exports = {
  createProject,
  updateProject ,
  getProjectByProjectId,
  getProject,
  getProjectById,
  getProjectsByClient,
  deleteProject,
  getEmployeesByProjectId,
  getProjectDetailById
};
