
const Task = require('../../model/Task/Task');
const Notification = require('../../model/Notification/Notification');

const notifyTask = async (req, res) => {
  try {
    const { taskId } = req.body;

    // Find the task and populate assigned employees
    const task = await Task.findById(taskId).populate('assignedTo');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    let createdCount = 0;

    for (const employee of task.assignedTo) {
      // Create a new notification for every click
      const notification = new Notification({
        userId: employee._id, // required
        taskId: task._id,
        message: `Task "${task.title}" has been updated!`,
      });

      await notification.save(); // save in DB
      createdCount++;

      // Emit notification in real-time via Socket.io
      if (global.io) {
        global.io.to(employee._id.toString()).emit('newNotification', {
          message: `Task "${task.title}" has been updated!`,
          taskId: task._id,
        });
      }
    }

    res.json({
      message: 'Notification(s) created and emitted',
      createdCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { notifyTask };
