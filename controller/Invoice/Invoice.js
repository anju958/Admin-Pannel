const Invoice = require('../../model/Invoice/Invoice')
const Client = require('../../model/ClientLead/ClientLead');

// CREATE INVOICE

const createInvoice = async (req, res) => {
  try {
    const { projects, dueDate } = req.body;

    // Validate request
    if (!projects || projects.length === 0) return res.status(400).json({ error: "Select at least one project" });
    if (!dueDate) return res.status(400).json({ error: "Due date is required" });

    // Fetch client
    const client = await Client.findById(req.params.clientId);
    if (!client) return res.status(404).json({ error: "Client not found" });
    if (!client.emailId) return res.status(400).json({ error: "Client email not found" });

    // Calculate total
    const totalAmount = projects.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // Create invoice
    const invoice = new Invoice({
      clientId: client._id,
      clientName: client.leadName,
      clientEmail: client.emailId,
      projects,
      invoiceNumber: "INV-" + Date.now(),
      dueDate,
      totalAmount,
    });

    await invoice.save();
    res.status(201).json(invoice);

  } catch (err) {
    console.error("Error creating invoice:", err);
    res.status(500).json({ error: err.message });
  }
};
// const sendInvoiceEmail = async (req, res) => {
//   try {
//     const invoiceId = req.params.invoiceId;
//     const invoice = await Invoice.findById(invoiceId).populate("clientId", "leadName emailId");

//     if (!invoice) return res.status(404).json({ error: "Invoice not found" });

//     const clientEmail = invoice.clientEmail;
//     if (!clientEmail) return res.status(400).json({ error: "Client email not available" });

//     // ✅ Configure email transport (Use your real credentials)
//     const transporter = nodemailer.createTransport({
//       host: "smtp.gmail.com",
//       port: 587,
//       secure: false,
//       auth: {
//         user: "yourEmail@gmail.com",
//         pass: "yourAppPassword"
//       }
//     });

//     const mailOptions = {
//       from: `"Your Company" <yourEmail@gmail.com>`,
//       to: clientEmail,
//       subject: `Invoice ${invoice.invoiceNumber}`,
//       html: `
//         <h3>Hello ${invoice.clientName},</h3>
//         <p>Your invoice <strong>${invoice.invoiceNumber}</strong> has been generated.</p>
//         <p>Total Amount: ₹${invoice.totalAmount}</p>
//         <p>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
//       `
//     };

//     await transporter.sendMail(mailOptions);
//     res.json({ success: true, message: "Invoice email sent!" });

//   } catch (err) {
//     console.error("Error in sendInvoiceEmail:", err);
//     res.status(500).json({ error: err.message });
//   }
// };



// GET ALL INVOICES FOR A CLIENT
const getAllInvoice = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("projects.projectId", "projectName price")
      .populate("clientId", "leadName emailId")
      .sort({ date: -1 }); // latest first

    res.json({ success: true, invoices });
  } catch (err) {
    console.error("Error fetching invoices:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// GET SINGLE INVOICE
const getSingleInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
      .populate("projects.projectId", "projectName")
      .populate("clientId", "leadName emailId");

    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (err) {
    console.error("Error fetching invoice:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get invoices by clientId

const getInvoicesByClient = async (req, res) => {
  try {
    const clientId = req.params.clientId;
    if (!clientId) return res.status(400).json({ success: false, message: "Client ID required" });

    const invoices = await Invoice.find({ clientId })
      .populate("projects.projectId", "projectName price")
      .sort({ date: -1 });

    res.json({ success: true, invoices }); // Always return invoices as array
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
module.exports = { createInvoice, getAllInvoice, getSingleInvoice, getInvoicesByClient };
