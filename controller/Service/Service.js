  const Service = require('../../model/Services/Service');
  const Department = require('../../model/Department/AddDepartment');
  const Project = require('../../model/Project/Projects')
  const createRoleBasedNotification = require(
    "../../utils/createRoleBasedNotification"
  );

const addService = async (req, res) => {
  try {
    // 🔐 Ensure auth
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { serviceName, servicePrice, deptId } = req.body;

    if (!serviceName || !deptId || !servicePrice) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check department
    const department = await Department.findById(deptId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Duplicate check (case insensitive)
    const existingService = await Service.findOne({
      serviceName: { $regex: new RegExp(`^${serviceName}$`, "i") },
      deptId: deptId,
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: `Service "${serviceName}" already exists under department "${department.deptName}".`,
      });
    }

    // Save new service
    const newService = new Service({
      serviceName,
      servicePrice,
      deptId,
    });

    const savedService = await newService.save();

    /* 🔔 ROLE-BASED NOTIFICATION */
    await createRoleBasedNotification({
      type: "SERVICE_CREATED",
      title: "New Service Added",
      message: `Service "${serviceName}" was added under "${department.deptName}" by ${req.user.role}`,
      module: "service",
      refId: savedService._id,
      actorUserId: req.user.id,               // JWT id
      actorRole: req.user.role.toLowerCase(), // normalized
    });

    res.status(201).json({
      success: true,
      message: "Service added successfully",
      data: savedService,
    });
  } catch (error) {
    console.error("Error adding service:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

  const getServicesByDept = async (req, res) => {
    try {
      const { deptId } = req.params;

      const services = await Service.find({ deptId })
        .populate("deptId", "deptName deptId  servicePrice"); 

      res.json(services);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };


  const getAllServices = async (req, res) => {
    try {
      const services = await Service.find()
        .populate("deptId", "deptName deptId servicePrice");

      res.json(services);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  const getServicebyId = async(req , res)=>{
    try {
    const service = await Service.findById(req.params.id)
      .populate("deptId", "deptName deptId");
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
  }

  const deleteService = async (req, res) => {
  try {
    // 🔐 Ensure auth context
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const deletedService = await Service.findByIdAndDelete(id);

    if (!deletedService) {
      return res.status(404).json({ message: "Service not found" });
    }

    /* 🔔 ROLE-BASED NOTIFICATION */
    await createRoleBasedNotification({
      type: "SERVICE_DELETED",
      title: "Service Deleted",
      message: `Service "${deletedService.serviceName}" was deleted by ${req.user.role}`,
      module: "service",
      refId: deletedService._id,
      actorUserId: req.user.id,               // ✅ JWT id
      actorRole: req.user.role.toLowerCase(), // ✅ normalized
    });

    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    console.error("Delete Service Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};



const updateService = async (req, res) => {
  try {
    // 🔐 Ensure auth context
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { serviceName, servicePrice, deptId } = req.body;

    if (!serviceName || !servicePrice || !deptId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Update service
    const updatedService = await Service.findByIdAndUpdate(
      id,
      { serviceName, servicePrice, deptId },
      { new: true, runValidators: true }
    );

    if (!updatedService) {
      return res.status(404).json({ message: "Service not found" });
    }

    /* 🔔 ROLE-BASED NOTIFICATION */
    await createRoleBasedNotification({
      type: "SERVICE_UPDATED",
      title: "Service Updated",
      message: `Service "${serviceName}" was updated by ${req.user.role}`,
      module: "service",
      refId: updatedService._id,
      actorUserId: req.user.id,               // ✅ JWT id
      actorRole: req.user.role.toLowerCase(), // ✅ normalized
    });

    res.json({
      message: "Service updated successfully",
      data: updatedService,
    });
  } catch (err) {
    console.error("Update Service Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

const getServiceByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate("service", "serviceName");
    if (!project) return res.status(404).json({ message: "Project not found" });

    res.status(200).json({
      message: "Services fetched successfully",
      services: [project.service],
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


  module.exports = { addService, getServicesByDept, getAllServices  , deleteService  , updateService , getServicebyId , getServiceByProject};
