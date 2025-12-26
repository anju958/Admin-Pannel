const express = require("express");
const router = express.Router();
const uploadComment = require("../../controller/middleware/multerComment");
const upload = require("../../controller/middleware/uploadReason");
const path = require("path");
const Task = require("../../model/Task/Task");

const {
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
  serveAttachment,
  autoStopTimer
} = require("../../controller/Task/Task");
const { notifyEmployees } = require("../../controller/Notification/adminNotify");
const { getAdminMessagesByTask } = require("../../controller/Notification/getEmployeeNotification");



// =========================
// ADMIN
// =========================
router.post("/add", addTask);
router.get("/all", getAllTasks);
router.get("/view/:taskId", viewTask);
router.put("/update/:id", updateTask);
router.delete("/delete/:id", deleteTask);

// =========================
// EMPLOYEE TASK LIST
// =========================
router.get("/employee/:empId", getTasks);

// ---------- ALIASES (frontend compatibility) ----------
router.get("/employeeTask/:empId", getTasks); 
router.get("/getTasksByEmployee/:employeeId", getTasks); 

// =========================
// TIMER (frontend expects these URLs)
// =========================
router.post("/timerStart/:taskId", startTimer);     // matches frontend
router.post("/stopTimer/:taskId", stopTimer); 
router.post("/autoStopTimer/:employeeId", autoStopTimer);
      // matches frontend

// =========================
// STATUS UPDATE
// =========================
router.patch(
  "/TaskStatus/:taskId",
  upload.single("attachment"),
  updateTaskStatus
);// matches frontend

// =========================
// COMMENTS
// =========================
router.post(
  "/comment/:taskId",
  uploadComment.single("attachment"),
  addComment
);

// =========================
// CLIENT VIEW
// =========================
router.get("/client/view/:taskId", viewTaskForClient);

// =========================
// ATTACHMENT SERVE
// =========================
router.get("/attachments/:filename", serveAttachment);

router.get("/task/status-file/:taskId", async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task || !task.statusHistory?.length) {
      return res.status(404).send("No status history");
    }

    const lastStatus =
      task.statusHistory[task.statusHistory.length - 1];

    if (!lastStatus.attachment) {
      return res.status(404).send("No attachment found");
    }

    // 🔑 ABSOLUTE PATH (VERY IMPORTANT)
    const filePath = path.join(
      process.cwd(),
      lastStatus.attachment
    );

    return res.sendFile(filePath);
  } catch (err) {
    console.error("FILE LOAD ERROR:", err);
    res.status(500).send("Unable to load file");
  }
});
router.get("/notifications/:employeeId", async (req, res) => {
  const data = await Notification.find({
    user: req.params.employeeId,
  })
    .sort({ createdAt: -1 })
    .limit(10);

  res.json(data);
});


router.post("/notify/:taskId", notifyEmployees);

router.get(
  "/adminMessages/:taskId",
  getAdminMessagesByTask
);

module.exports = router;
