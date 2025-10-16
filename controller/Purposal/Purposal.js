const Proposal = require("../../model/Purposal/Purposal");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Multer memory storage for uploaded files
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Email sending helper function
async function sendProposalEmail({ clientEmail, clientName, title, description, category, services, terms, files = [] }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const logoBuffer = fs.readFileSync(path.join(__dirname, "..", "uploads", "logo", "premier-logo.png"));

  const mailOptions = {
    from: `"Premier WEBTECH" <${process.env.EMAIL_USER}>`,
    to: clientEmail,
    subject: `Proposal: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:companylogo" style="width:150px;" />
        </div>
        <h2 style="text-align: center;">Proposal for ${clientName || "Client"}</h2>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p><strong>Category:</strong> ${category.join(", ")}</p>
        <p><strong>Services:</strong></p>
        <ul>
          ${services.map((s) => `<li>${s.name} - ₹${s.price}</li>`).join("")}
        </ul>
        <p><strong>Total Price:</strong> ₹${services.reduce((acc, s) => acc + (s.price || 0), 0)}</p>
        <p><strong>Terms:</strong> ${terms}</p>
      </div>
    `,
    attachments: [
      ...files,
      {
        filename: "premier-logo.png",
        content: logoBuffer,
        cid: "companylogo",
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

const createAndSendProposal = async (req, res) => {
  try {
    const { clientId, title, services, description, category, terms, clientName, clientEmail } = req.body;

    const parsedServices = JSON.parse(services || "[]");
    const parsedCategory = JSON.parse(category || "[]");

    const newProposal = new Proposal({
      clientId,
      title,
      services: parsedServices,
      description,
      category: parsedCategory,
      terms,
      attachments: (req.files || []).map((file) => file.originalname),
      clientResponse: "",
      status: "Sent",
    });
    await newProposal.save();

    await sendProposalEmail({
      clientEmail,
      clientName,
      title,
      description,
      category: parsedCategory,
      services: parsedServices,
      terms,
      files: (req.files || []).map((file) => ({
        filename: file.originalname,
        content: file.buffer,
      })),
    });

    res.status(201).json({ success: true, proposal: newProposal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, terms, services, category } = req.body;

    // Parse services and category JSON strings to arrays
    const parsedServices = services ? JSON.parse(services) : [];
    const parsedCategory = category ? JSON.parse(category) : [];

    // Parse existing attachments from body
    // We expect 'existingAttachments' to come as array or single string from FormData
    let existingAttachments = [];
    if (req.body.existingAttachments) {
      existingAttachments = Array.isArray(req.body.existingAttachments)
        ? req.body.existingAttachments
        : [req.body.existingAttachments];
    }

    // Extract newly uploaded files' original names
    const uploadedFiles = (req.files || []).map((file) => file.originalname);

    // Combine existing and newly uploaded attachments
    const allAttachments = [...existingAttachments, ...uploadedFiles];

    // Update proposal document in database
    const updatedProposal = await Proposal.findByIdAndUpdate(
      id,
      {
        title,
        description,
        terms,
        status: "Sent",
        services: parsedServices,
        category: parsedCategory,
        attachments: allAttachments,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    ).populate("clientId", "leadName emailId personal_email");

    if (!updatedProposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    // Determine client email and name for sending email
    const clientEmail = updatedProposal.clientId.emailId || updatedProposal.clientId.personal_email;
    const clientName = updatedProposal.clientId.leadName || updatedProposal.clientId.ename;

    // Prepare email attachments array
    const emailAttachments = [];

    // Add existing attachments by reading file buffers from disk (adjust path accordingly)
    for (const fileName of existingAttachments) {
      if (fileName) {
        try {
          const filePath = path.join(__dirname, "..", "uploads", "attachments", fileName);
          emailAttachments.push({
            filename: fileName,
            content: fs.readFileSync(filePath),
          });
        } catch (e) {
          console.warn("Failed to read file for email attachment:", fileName);
        }
      }
    }

    // Add new file buffers from uploaded files
    emailAttachments.push(
      ...(req.files || []).map((file) => ({
        filename: file.originalname,
        content: file.buffer,
      }))
    );

    // Send updated proposal email with attachments
    await sendProposalEmail({
      clientEmail,
      clientName,
      title: updatedProposal.title,
      description: updatedProposal.description,
      category: updatedProposal.category || [],
      services: updatedProposal.services || [],
      terms: updatedProposal.terms,
      files: emailAttachments,
    });

    // Respond with updated proposal
    res.status(200).json(updatedProposal);
  } catch (err) {
    console.error("Error updating proposal:", err);
    res.status(500).json({ message: "Server error while updating proposal" });
  }
};


const getAllProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find()
      .populate("clientId", "leadName")
      .sort({ createdAt: -1 });
    res.status(200).json(proposals);
  } catch (err) {
    console.error("Error fetching proposals:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const deleteProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProposal = await Proposal.findByIdAndDelete(id);
    if (!deletedProposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }
    res.status(200).json({ message: "Proposal deleted successfully" });
  } catch (error) {
    console.error("Error deleting proposal:", error);
    res.status(500).json({ message: "Server error while deleting proposal" });
  }
};

const getProposalById = async (req, res) => {
  try {
    const { id } = req.params;
    const proposal = await Proposal.findById(id)
      .populate("clientId", "leadName emailId phoneNo")
      .lean();
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }
    res.status(200).json(proposal);
  } catch (error) {
    console.error("Error fetching proposal by ID:", error);
    res.status(500).json({ message: "Server error while fetching proposal" });
  }
};

const approveProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ["Accepted", "Rejected"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const updatedProposal = await Proposal.findByIdAndUpdate(id, { status }, { new: true });
    if (!updatedProposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }
    res.status(200).json(updatedProposal);
  } catch (err) {
    console.error("Error updating proposal status:", err);
    res.status(500).json({ message: "Server error while updating status" });
  }
};

module.exports = {
  createAndSendProposal,
  upload,
  getAllProposals,
  updateProposal,
  deleteProposal,
  getProposalById,
  approveProposal,
};
