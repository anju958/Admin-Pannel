  const Service = require('../../model/Services/Service');
  const Department = require('../../model/Department/AddDepartment');
  const Project = require('../../model/Project/Projects')


  // const addService = async (req, res) => {
  //   try {
  //     const { serviceName, servicePrice , deptId } = req.body;

  //     if (!serviceName || !deptId || !servicePrice) {
  //       return res.status(400).json({ message: "Service name and department ID are required" });
  //     }

    
  //     const department = await Department.findById(deptId);
  //     if (!department) {
  //       return res.status(404).json({ message: "Department not found" });
  //     }

  
  //     const newService = new Service({ serviceName, deptId  ,servicePrice});
  //     const savedService = await newService.save();

  //     res.status(201).json(savedService);
  //   } catch (error) {
  //     res.status(500).json({ message: error.message });
  //   }
  // };

  const addService = async (req, res) => {
  try {
    const { serviceName, servicePrice, deptId } = req.body;

    if (!serviceName || !deptId || !servicePrice) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check department
    const department = await Department.findById(deptId);
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
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
    const newService = new Service({ serviceName, servicePrice, deptId });
    const savedService = await newService.save();

    res.status(201).json({
      success: true,
      message: "Service added successfully",
      data: savedService,
    });
  } catch (error) {
    console.error("Error adding service:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
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

  const deleteService = async(req , res)=>{
     try {
    const { id } = req.params;
    const deleted = await Service.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Service not found" });
    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
  }
  
  const updateService = async (req, res) => {
  try {
    const { id } = req.params;
      console.log("Updating Service ID:", id);
    const { serviceName, servicePrice, deptId } = req.body;

    // Find service by ID and update
    const updatedService = await Service.findByIdAndUpdate(
      id,
      { serviceName, servicePrice, deptId },
      { new: true } // return updated document
    );

    if (!updatedService) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ message: "Service updated successfully", data: updatedService });
  } catch (err) {
    console.error(err);
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
