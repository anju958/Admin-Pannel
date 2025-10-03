const Leaves = require('../../../model/userPannel/Leaves/Leaves')

const add_leave = async (req, res) => {
    try {
        const { leave_type, from_date, to_date, reason } = req.body;
        if (!leave_type || !from_date || !to_date || !reason) {
            return res.status(400).json({ message: "All Field Required" })
        }
        const newleave = new Leaves({
            leave_type,
            from_date,
            to_date,
            reason
        })
        await newleave.save();
        res.status(201).json({ message: "Leave added successfully", leave: newleave });

    } catch (error) {
        console.error("Error adding leave:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
const get_leaves = async (req, res) => {
  try {
    const leaves = await Leaves.find().sort({ createdAt: -1 }); 
    res.status(200).json(leaves);
  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
module.exports = { add_leave , get_leaves };