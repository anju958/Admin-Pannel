
const JobOpening = require("../../model/JobOpening/JobOpening");

const updateVacancy = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { count } = req.body; 

    const job = await JobOpening.findOne({ jobId });
    if (!job) return res.status(404).json({ message: "Job not found" });
    
    if (job.availableVacancies <= 0 && count > 0) {
      return res.status(400).json({ message: "No vacancies available" });
    }


    job.selected_emp += count; 
    job.availableVacancies = job.no_of_Opening - job.selected_emp;

    await job.save();

    res.status(200).json({ message: "Vacancy updated", job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { updateVacancy };
