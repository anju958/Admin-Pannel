
const Proposal = require("../../model/Purposal/Purposal");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Multer memory storage for uploaded files
const storage = multer.memoryStorage();
const upload = multer({ storage });

const createAndSendProposal = async (req, res) => {
  try {
    const {
      clientId,
      title,
      services,
      description,
      category,
      terms,
      clientName,
      clientEmail,
    } = req.body;

    // Save proposal document
    const newProposal = new Proposal({
      clientId,
      title,
      services: JSON.parse(services || "[]"),
      description,
      category: JSON.parse(category || "[]"),
      terms,
      attachments: (req.files || []).map((file) => file.originalname),
      clientResponse: "",
    });

    await newProposal.save();

    // Nodemailer transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    // Read company logo into memory
    const logoBuffer = fs.readFileSync(
      path.join(__dirname, "..", "uploads", "logo", "premier-logo.png")
    );

    // Email options
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
          <p><strong>Category:</strong> ${JSON.parse(category || "[]").join(", ")}</p>
          <p><strong>Services:</strong></p>
          <ul>
            ${JSON.parse(services || "[]")
              .map((s) => `<li>${s.name} - ₹${s.price}</li>`)
              .join("")}
          </ul>
          <p><strong>Total Price:</strong> ₹${JSON.parse(services || "[]").reduce(
            (acc, s) => acc + (s.price || 0),
            0
          )}</p>
          <p><strong>Terms:</strong> ${terms}</p>
        </div>
      `,
      attachments: [
        ...(req.files || []).map((file) => ({
          filename: file.originalname,
          content: file.buffer,
        })),
        {
          filename: "premier-logo.png",
          content: logoBuffer,
          cid: "companylogo",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ success: true, proposal: newProposal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
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

const updateProposal = async (req, res) => {
  try {
    const { id } = req.params;

    // Parse fields from form-data
    const {
      title,
      description,
      terms,
      status,
      services,
      category,
      attachments, // existing attachments as JSON string
    } = req.body;

    // Parse arrays
    const parsedServices = services ? JSON.parse(services) : [];
    const parsedCategory = category ? JSON.parse(category) : [];
    const existingAttachments = attachments ? JSON.parse(attachments) : [];

    // Handle uploaded files
    const uploadedFiles = (req.files || []).map((file) => file.originalname);

    // Combine existing + new files
    const allAttachments = [...existingAttachments, ...uploadedFiles];

    // Update proposal document
    const updatedProposal = await Proposal.findByIdAndUpdate(
      id,
      {
        title,
        description,
        terms,
        status: "Sent", // automatically mark as Sent
        services: parsedServices,
        category: parsedCategory,
        attachments: allAttachments,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    ).populate("clientId", "leadName emailId phoneNo"); // populate client info

    if (!updatedProposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    res.status(200).json(updatedProposal);
  } catch (err) {
    console.error("Error updating proposal:", err);
    res.status(500).json({ message: "Server error while updating proposal" });
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
      .populate("clientId", "leadName emailId phoneNo") // populate client info
      .lean(); // return plain JS object

    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    res.status(200).json(proposal);
  } catch (error) {
    console.error("Error fetching proposal by ID:", error);
    res.status(500).json({ message: "Server error while fetching proposal" });
  }
};

module.exports = { createAndSendProposal, upload, getAllProposals , updateProposal , deleteProposal ,getProposalById  };
