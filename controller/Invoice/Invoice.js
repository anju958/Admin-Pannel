const Invoice = require("../../model/Invoice/Invoice");
const nodemailer = require("nodemailer");
const companyDetail = require('../../model/CompanyDetails/CompanyDetails')

// function getProjectDisplayName(project) {
//   if (!project || typeof project !== "object") return "Unnamed Project";
//   return (
//     project.projectName ||
//     project.project_name ||
//     project.title ||
//     project.name ||
//     project.serviceName ||
//     project.project_type ||
//     project.projectCategory?.join(", ") ||
//     project.service?.serviceName ||
//     "Unnamed Project"
//   );
// }
function getProjectDisplayName(project) {
  if (!project || typeof project !== "object") return "Unnamed Project";
  return (
    project.projectName ||
    project.name ||
    project.project_title ||
    project.project_name ||
    project.title ||
    project.projectType ||
    project.project_type ||
    project.serviceName ||
    project.project ||
    (project.service && (project.service.serviceName || project.service.name)) || // <-- this line important!
    (typeof project.service === "string" && project.service) ||
    (Array.isArray(project.projectCategory) && project.projectCategory.length
      ? project.projectCategory.join(", ")
      : undefined) ||
    String(project) ||
    "Unnamed Project"
  );
}


const createInvoice = async (req, res) => {
  try {
    const { clientId, clientEmail, clientName, projects, dueDate, sendNow } = req.body;

    if (!clientId || !clientName || !clientEmail) {
      return res
        .status(400)
        .json({ error: "clientId, clientName and clientEmail required." });
    }

    if (!projects || !projects.length) {
      return res.status(400).json({ error: "Projects required" });
    }

    // const normalizedProjects = projects.map((p) => ({
    //   ...p,
    //   projectName: getProjectDisplayName(p),
    // }));
    console.log("RAW PROJECTS PAYLOAD:", projects);

    // const normalizedProjects = projects.map((p) => {
    //   let name = p.projectName || p.name || p.title || p.project_title || p.project_name || p.project || (p.service && p.service.serviceName);
    //   if (!name) name = getProjectDisplayName(p);
    //   return {
    //     ...p,
    //     projectName: name || "Unnamed Project"
    //   }
    // });


    const normalizedProjects = projects.map((p) => {
  let name =
    p.projectName ||
    p.name ||
    p.title ||
    p.project_title ||
    p.project_name ||
    p.project ||
    (p.service && (p.service.serviceName || p.service.name)) || // <- covers some nested
    (typeof p.service === "string" && p.service) ||
    (Array.isArray(p.projectCategory) && p.projectCategory.length
      ? p.projectCategory.join(", ")
      : undefined);

  if (!name) name = getProjectDisplayName(p);
  return {
    ...p,
    projectName: name || "Unnamed Project"
  };
});

    const totalAmount = normalizedProjects.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

    const invoice = new Invoice({
      clientId,
      clientEmail,
      clientName,
      projects: normalizedProjects,
      invoiceNumber: "INV-" + Date.now(),
      dueDate,
      totalAmount,
      sentFrom: process.env.EMAIL_USER,
      status: sendNow ? "Pending" : "Draft",
      isDraft: !sendNow,
    });

    await invoice.save();

    // ✅ If user only wants to save, skip sending email
    if (!sendNow) {
      return res.status(201).json({
        success: true,
        message: "Invoice saved as draft.",
        invoice,
      });
    }

    // ✅ Otherwise send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });



    const company = await companyDetail.findOne(); // fetch once before this block
    await transporter.sendMail({
      from: company?.email?.trim() || process.env.EMAIL_USER,
      to: clientEmail,
      subject: `Invoice #${invoice.invoiceNumber} (₹${totalAmount})`,
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 660px; margin: auto; border-radius: 12px; border: 1px solid #eee; padding: 32px;">

      <h2 style="margin-bottom: 12px; color: #1976d2;">Invoice from Premier WebTech</h2>

      <p>Dear <b>${clientName}</b>,</p>
      <p>Please pay your invoice <b style="color:#222;">#${invoice.invoiceNumber}</b>:</p>

      <table style="border-collapse: collapse; width: 100%; margin: 24px 0;">
        <thead>
          <tr>
            <th style="border: 1px solid #ccc; padding: 10px; text-align: left; background: #fafafa;">Service/Project</th>
            <th style="border: 1px solid #ccc; padding: 10px; text-align: right; background: #fafafa;">Price (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${normalizedProjects.map(p => `
          <tr>
            <td style="border: 1px solid #ccc; padding: 10px;">${p.projectName}</td>
            <td style="border: 1px solid #ccc; padding: 10px; text-align: right;">${Number(p.amount || 0).toLocaleString()}</td>
          </tr>`).join("")}
          <tr>
            <td style="border: 1px solid #ccc; padding: 10px; font-weight: bold;">Total</td>
            <td style="border: 1px solid #ccc; padding: 10px; text-align: right; font-weight: bold;">₹${totalAmount.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin:16px 0;">
        <b>Bank Payment Details:</b>
        <ul style="padding-left: 1em;">
          <li>Bank: ${company?.bank?.bankName || ''}</li>
          <li>Account Number: ${company?.bank?.accountNumber || ''}</li>
          <li>IFSC: ${company?.bank?.ifsc || ''}</li>
          ${company?.taxId ? `<li>GST: ${company.taxId}</li>` : ''}
        </ul>
      </div>

      <hr style="margin: 20px 0;">

      <div style="font-size: 14px; line-height: 1.4; color: #555;">
        <p><b>Address:</b> ${company?.address?.street || ''}${company?.address?.city ? ', ' + company.address.city : ''}${company?.address?.state ? ', ' + company.address.state : ''}${company?.address?.country ? ', ' + company.address.country : ''}${company?.address?.zip ? ', ZIP: ' + company.address.zip : ''}</p>
        <p><b>Email:</b> ${company?.email?.trim() || ''} <b>Phone:</b> ${company?.phone || ''}</p>
        <p><b>Website:</b> <a href="${company?.website || '#'}">${company?.website || ''}</a></p>
      </div>
    </div>
  `
    });
    res.status(201).json({
      success: true,
      message: "Invoice created and sent.",
      invoice,
    });
  } catch (err) {
    console.error("createInvoice error:", err);
    res.status(500).json({ error: err.message });
  }
};


const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ date: -1 });
    res.json({ success: true, invoices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET single invoice

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice)
      return res.status(404).json({ success: false, error: "Invoice not found" });
    res.json({ success: true, invoice }); // payment history included
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const markInvoicePaid = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { paidAmount } = req.body; // This is the payment being made now
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    // Add the new payment to the already paid
    const newPaidAmount = Number(invoice.paidAmount || 0) + Number(paidAmount);
    if (newPaidAmount > invoice.totalAmount) {
      return res.status(400).json({ error: "Total paid cannot exceed invoice total" });
    }

    invoice.paidAmount = newPaidAmount;
    invoice.remainingAmount = invoice.totalAmount - newPaidAmount;

    if (newPaidAmount === invoice.totalAmount) {
      invoice.status = "Paid";
      invoice.paidAt = new Date();
    } else if (newPaidAmount > 0) {
      invoice.status = "Partial";
      invoice.paidAt = new Date();
    } else {
      invoice.status = "Pending";
      invoice.paidAt = null;
    }

    await invoice.save();
    res.json({ success: true, message: "Invoice updated", invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// DELETE invoice
const deleteInvoice = async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
const getInvoicesByClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ message: "Client ID is required" });
    }

    const invoices = await Invoice.find({ clientId }).sort({ date: -1 });
    res.json({ success: true, invoices });
  } catch (error) {
    console.error("❌ Error fetching invoices by client:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
const addPayment = async (req, res) => {
  try {
    const { id } = req.params; // invoice id
    const { amount, method, note } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // Log payment history entry
    invoice.payments = invoice.payments || [];
    invoice.payments.push({
      amount: Number(amount),
      method,
      note,
      date: new Date(),
    });

    // Update totals and status
    invoice.paidAmount += Number(amount);
    invoice.remainingAmount = Math.max(invoice.totalAmount - invoice.paidAmount, 0);

    if (invoice.paidAmount >= invoice.totalAmount) {
      invoice.status = "Paid";
      invoice.paidAt = new Date();
    } else if (invoice.paidAmount > 0) {
      invoice.status = "Partial";
    } else {
      invoice.status = "Pending";
    }

    await invoice.save();

    res.json({
      success: true,
      message: "Payment added successfully",
      invoice, // includes payment history
    });
  } catch (err) {
    console.error("Error adding payment:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



module.exports = { addPayment, getAllInvoices, getInvoiceById, deleteInvoice, createInvoice, markInvoicePaid, getInvoicesByClient };
