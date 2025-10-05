const Task = require("../../model/Task/Task");
const SignUp = require('../../model/SignUp/SignUp')

// ✅ Add Task
const addTask = async (req, res) => {
  try {
    const {
      clientId,
      projectId,
      serviceId,
      departmentId,
      assignedTo,
      title,
      category,
      startDate,
      dueDate,
      status,
      description,
    } = req.body;

    const newTask = new Task({
      clientId,
      projectId,
      serviceId,
      departmentId,
      assignedTo,
      title,
      category,
      startDate,
      dueDate,
      status,
      description,
    });

    const saveTask = await newTask.save();
    return res.status(200).json({ message: "Task Assigned Successfully ✅", task: saveTask });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get All Tasks
const getTasks = async (req, res) => {
  try {
    const getData = await Task.find()
      .populate("clientId", "clientName")
      .populate("projectId", "projectName")
      .populate("serviceId", "serviceName")
      .populate("departmentId", "deptName")
      .populate("assignedTo", "ename")
      .sort({ createdAt: -1 });

    res.status(200).json(getData);
  } catch (error) {
    res.status(500).json({ message: "Error Fetching Tasks", error: error });
  }
};

// ✅ Delete Task
const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    const deletedTask = await Task.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully ✅", deletedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo", "ename") // populate assigned employee names
      .sort({ createdAt: -1 }); // newest tasks first

    res.status(200).json({
      message: "Tasks fetched successfully",
      tasks: tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, status, priority, assignedTo } = req.body;

    // Find task and update
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        title,
        description,
        status,
        priority,
        assignedTo,
      },
      { new: true }
    )
      .populate("assignedTo", "ename") // populate employee names
      .populate("clientId", "leadName")
      .populate("projectId", "projectName")
      .populate("serviceId", "serviceName");

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};




module.exports = { addTask, getTasks, deleteTask , getAllTasks  , updateTask};
