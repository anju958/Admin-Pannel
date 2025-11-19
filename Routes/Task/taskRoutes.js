const express = require("express");
const router = express.Router();
const uploadComment = require("../../controller/middleware/multerComment");

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
  serveAttachment
} = require("../../controller/Task/Task");

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
router.post("/stopTimer/:taskId", stopTimer);       // matches frontend

// =========================
// STATUS UPDATE
// =========================
router.patch("/TaskStatus/:taskId", updateTaskStatus); // matches frontend

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

module.exports = router;
