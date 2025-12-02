const Holiday = require("../../model/Holiday/Holiday");
const Attendance = require("../../model/Attendance/Attendance");
const SignUp = require("../../model/SignUp/SignUp");

function toDateOnly(d) {
  const dt = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return new Date(dt.toISOString().split('T')[0]);
}

// Create holiday (admin)
async function createHoliday(req, res) {
  try {
    const { date, title, description, isPaid } = req.body;
    if (!date) return res.status(400).json({ message: "date is required" });

    const d = toDateOnly(new Date(date));
    const existing = await Holiday.findOne({ date: d });
    if (existing) return res.status(409).json({ message: "Holiday already exists for this date" });

    const hol = new Holiday({
      date: d,
      title,
      description,
      isPaid: typeof isPaid === "boolean" ? isPaid : true,
      createdBy: req.user?.id // optional admin id
    });
    await hol.save();

    // propagate to attendance for all employees
    // (we reuse cron propagation logic behaviorally; here do it immediately)
    const employees = await SignUp.find({ isActive: true });
    for (const emp of employees) {
      const att = await Attendance.findOne({ empId: emp._id, date: d });
      if (!att) {
        await new Attendance({
          empId: emp._id,
          date: d,
          status: "Holiday",
          remark: `Holiday: ${title || "Holiday"}`
        }).save();
      } else {
        if (att.status !== "Leave") {
          att.status = "Holiday";
          att.remark = `Holiday: ${title || "Holiday"}`;
          att.deductionAmount = 0;
          await att.save();
        }
      }
    }

    res.status(201).json({ message: "Holiday created", holiday: hol });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

// Delete holiday (admin) - also revert attendance entries if needed
async function deleteHoliday(req, res) {
  try {
    const { id } = req.params;
    const hol = await Holiday.findByIdAndDelete(id);
    if (!hol) return res.status(404).json({ message: "Holiday not found" });

    const dateOnly = hol.date;
    // For attendance entries created exclusively because of holiday, decide behavior:
    // We'll only revert entries with status = "Holiday" and remark starting with "Holiday:"
    await Attendance.updateMany(
      { date: dateOnly, status: "Holiday", remark: { $regex: /^Holiday:/ } },
      { $set: { status: "Absent", remark: "Holiday removed by admin - marked Absent. Please correct if needed", isAutoMarkedAbsent: true } }
    );

    res.json({ message: "Holiday deleted and attendance updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

async function getAllHolidays(req, res) {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

module.exports = {
  createHoliday,
  deleteHoliday,
  getAllHolidays
};
