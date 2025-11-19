// controller/Task/Task.js
const Task = require("../../model/Task/Task");
const SignUp = require("../../model/SignUp/SignUp");
const path = require("path");
const fs = require("fs");

// ---------- Add Task (Admin) ----------
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
      priority,
      estimatedTime
    } = req.body;

    if (!clientId || !projectId || !title || !startDate || !dueDate) {
      return res.status(400).json({ message: "Required fields missing!" });
    }

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
      status: status || "Pending",
      description,
      priority: priority || "Low",
      estimatedTime: estimatedTime || 0,
      timeSpent: 0,
      timeLogs: [],
      comments: []
    });

    const saveTask = await newTask.save();
    return res.status(200).json({ message: "Task Assigned Successfully ✅", task: saveTask });
  } catch (error) {
    console.error("addTask:", error);
    res.status(500).json({ message: error.message });
  }
};

// ---------- Get All Tasks (Admin) ----------
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo", "ename name email")
      .populate("clientId", "leadName clientName")
      .populate("projectId", "projectName")
      .sort({ createdAt: -1 });

    res.status(200).json({ message: "Tasks fetched successfully", tasks });
  } catch (error) {
    console.error("getAllTasks:", error);
    res.status(500).json({ message: error.message });
  }
};

// ---------- Get Tasks assigned to an employee (alias and original) ----------
const getTasks = async (req, res) => {
  try {
    const employeeId = req.params.empId || req.params.employeeId;
    if (!employeeId) return res.status(400).json({ message: "empId required" });

    const tasks = await Task.find({ assignedTo: employeeId })
      .populate("assignedTo", "ename name email")
      .populate("projectId", "projectName")
      .populate("clientId", "clientName")
      .sort({ createdAt: -1 });

    // format for employee frontend
    const formatted = tasks.map(t => ({
      _id: t._id,
      taskId: t.TaskId,
      title: t.title,
      project: t.projectId?.projectName,
      completedOn: t.completedOn,
      startDate: t.startDate,
      dueDate: t.dueDate,
      estimatedTime: t.estimatedTime,
      timeSpent: t.timeSpent,
      assignedTo: t.assignedTo.map(u => ({ _id: u._id, name: u.ename || u.name || u.email })),
      status: t.status,
      priority: t.priority,
      incompleteReason: t.incompleteReason,
      commentsCount: t.comments?.length || 0
    }));

    return res.status(200).json({ success: true, tasks: formatted });
  } catch (err) {
    console.error("getTasks:", err);
    res.status(500).json({ message: err.message });
  }
};

// ---------- View task (Admin full) ----------
const viewTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate("assignedTo", "ename email")
      .populate("comments.user", "ename email")
      .populate("projectId", "projectName")
      .populate("clientId", "leadName")
      .populate("serviceId", "serviceName");

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ---------- View task for employee (same as viewTask but can be used) ----------
const viewTaskForEmployee = async (req, res) => {
  return viewTask(req, res);
};

// ---------- View task for client (limited fields, only comments with visibleToClient true) ----------
const viewTaskForClient = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId)
      .populate("projectId", "projectName")
      .populate("serviceId", "serviceName")
      .populate("clientId", "clientName");

    if (!task) return res.status(404).json({ message: "Task not found" });

    const resp = {
      _id: task._id,
      TaskId: task.TaskId,
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      startDate: task.startDate,
      dueDate: task.dueDate,
      status: task.status,
      project: task.projectId?.projectName,
      service: task.serviceId?.serviceName,
      timeSpent: task.timeSpent,
      comments: (task.comments || []).filter(c => c.visibleToClient).map(c => ({
        text: c.text,
        attachment: c.attachment,
        createdAt: c.createdAt
      })),
    };

    return res.json({ success: true, task: resp });
  } catch (err) {
    console.error("viewTaskForClient:", err);
    res.status(500).json({ message: err.message });
  }
};

// ---------- Update Task (Admin) ----------
// const updateTask = async (req, res) => {
//   try {
//     const taskId = req.params.id;
//     const updateData = {
//       title: req.body.title,
//       description: req.body.description,
//       status: req.body.status,
//       priority: req.body.priority,
//       assignedTo: req.body.assignedTo,
//       startDate: req.body.startDate,
//       dueDate: req.body.dueDate,
//       category: req.body.category
//     };

//     const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, { new: true })
//       .populate("assignedTo", "ename name email")
//       .populate("clientId", "clientName")
//       .populate("projectId", "projectName");

//     if (!updatedTask) return res.status(404).json({ message: "Task not found" });

//     res.status(200).json({ success: true, message: "Task updated", task: updatedTask });
//   } catch (err) {
//     console.error("updateTask:", err);
//     res.status(500).json({ message: err.message });
//   }
// };


const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const body = req.body;

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      body,
      { new: true }
    )
      .populate("assignedTo", "ename") 
      .populate("clientId", "leadName")
      .populate("projectId", "projectName")
      .populate("serviceId", "serviceName");

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({
      success: true,
      task: updatedTask,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};



// ---------- Delete Task (Admin) ----------
const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const deletedTask = await Task.findByIdAndDelete(taskId);
    if (!deletedTask) return res.status(404).json({ message: "Task not found" });
    res.status(200).json({ success: true, message: "Task deleted" });
  } catch (err) {
    console.error("deleteTask:", err);
    res.status(500).json({ message: err.message });
  }
};

// ---------- Start Timer (Employee) ----------
const startTimer = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const task = await Task.findById(taskId);

    if (!task) return res.status(404).json({ message: "Task not found" });

    const lastLog =
      task.timeLogs.length > 0
        ? task.timeLogs[task.timeLogs.length - 1]
        : null;

    if (lastLog && !lastLog.endAt) {
      return res.status(400).json({ message: "Timer already running" });
    }

    task.timeLogs.push({
      startAt: new Date(),
      endAt: null,
      duration: 0,
    });

    await task.save();

    res.json({ success: true, message: "Timer started" });
  } catch (err) {
    console.error("startTimer error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// ---------- Stop Timer (Employee) ----------
const stopTimer = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const task = await Task.findById(taskId);

    if (!task) return res.status(404).json({ message: "Task not found" });

    const last = task.timeLogs[task.timeLogs.length - 1];

    if (!last || last.endAt) {
      return res.status(400).json({ message: "Timer is not running" });
    }

    last.endAt = new Date();
    last.duration = Math.floor((last.endAt - last.startAt) / 1000);

    task.timeSpent = task.timeLogs.reduce((acc, l) => acc + l.duration, 0);

    await task.save();

    res.json({
      success: true,
      message: "Timer stopped",
      timeSpent: task.timeSpent,
    });
  } catch (err) {
    console.error("stopTimer error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// ---------- Update Task Status (employee/admin) ----------
const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, reason } = req.body;
    const update = { status };

    if (status === "Completed") {
      update.completedOn = new Date();
      update.incompleteReason = "";
    } else {
      update.incompleteReason = reason || "";
    }

    const task = await Task.findByIdAndUpdate(taskId, update, { new: true });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ success: true, task });
  } catch (err) {
    console.error("updateTaskStatus:", err);
    res.status(500).json({ message: err.message });
  }
};

// ---------- Add Comment (with optional attachment) ----------
const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId, text } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const comment = {
      user: userId,
      text,
      createdAt: new Date()
    };

    if (req.file) {
      // save file path inside comment
      comment.attachment = `uploads/comments/${req.file.filename}`;
    }

    task.comments.push(comment);
    await task.save();

    res.json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ---------- Serve attachment (helper) ----------
const serveAttachment = (req, res) => {
  // attachments are stored under /controller/uploads (your project already exposes /uploads)
  const file = req.params.filename;
  const filePath = path.join(process.cwd(), "controller", "uploads", file);
  if (!fs.existsSync(filePath)) return res.status(404).send("Not found");
  res.sendFile(filePath);
};

module.exports = {
  addTask,
  getAllTasks,
  getTasks,
  viewTask,
  viewTaskForEmployee,
  viewTaskForClient,
  updateTask,
  deleteTask,
  startTimer,
  stopTimer,
  updateTaskStatus,
  addComment,
  serveAttachment
};
