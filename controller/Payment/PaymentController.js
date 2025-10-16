

// const Invoice = require("../../model/Invoice/Invoice");
// const nodemailer = require("nodemailer");

// const createInvoice = async (req, res) => {
//   try {
//     const { clientId, clientEmail, clientName, projects, dueDate } = req.body;
//     if (!clientId || !clientName || !clientEmail)
//       return res.status(400).json({ error: "clientId, clientName and clientEmail required." });
//     if (!projects || !projects.length)
//       return res.status(400).json({ error: "Projects required" });

//     const totalAmount = projects.reduce((sum, p) => sum + Number(p.amount || 0), 0);

//     const invoice = new Invoice({
//       clientId,
//       clientEmail,
//       clientName,
//       projects,
//       invoiceNumber: "INV-" + Date.now(),
//       dueDate,
//       totalAmount,
//     });

//     await invoice.save();

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: clientEmail,
//       subject: `Invoice #${invoice.invoiceNumber} (₹${totalAmount})`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border-radius: 12px; border: 1px solid #eee; padding: 32px;">
//           <h2 style="margin-bottom: 12px; color: #1976d2;">Premier WebTech</h2>
//           <p>Dear <b>${clientName}</b>,</p>
//           <p>
//             Please pay your invoice <b style="color:#222;">#${invoice.invoiceNumber}</b> using the bank details below:
//           </p>
//           <table style="border-collapse: collapse; width: 100%; margin: 24px 0;">
//             <thead>
//               <tr>
//                 <th style="border: 1px solid #ccc; padding: 10px; text-align: left; background: #fafafa;">Service/Project</th>
//                 <th style="border: 1px solid #ccc; padding: 10px; text-align: right; background: #fafafa;">Price (₹)</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${projects.map(p => `
//                 <tr>
//                   <td style="border: 1px solid #ccc; padding: 10px;">${p.name || p.title || "Service"}</td>
//                   <td style="border: 1px solid #ccc; padding: 10px; text-align: right;">${Number(p.amount).toLocaleString()}</td>
//                 </tr>
//               `).join('')}
//               <tr>
//                 <td style="border: 1px solid #ccc; padding: 10px; font-weight:bold;">Total</td>
//                 <td style="border: 1px solid #ccc; padding: 10px; text-align: right; font-weight: bold;">₹${totalAmount.toLocaleString()}</td>
//               </tr>
//             </tbody>
//           </table>
//           <div style="margin: 24px 0;">
//             <strong>Bank Payment Details:</strong>
//             <ul>
//               <li><strong>Bank:</strong> YOUR_BANK_NAME</li>
//               <li><strong>Account Number:</strong> XXXXX1234567</li>
//               <li><strong>IFSC Code:</strong> IFSC0000123</li>
//               <li><strong>Account Holder:</strong> YOUR_NAME</li>
//             </ul>
//           </div>
//           <p style="color: #e53935; font-weight: bold;">Invoice due date: ${new Date(dueDate).toLocaleDateString('en-GB')}</p>
//           <p style="margin-top: 24px;">If you have any questions, contact us at <a href="mailto:info@premierwebtech.com" style="color: #1976d2;">info@premierwebtech.com</a>.</p>
//           <p style="font-size: 13px; color: #888;">© 2025 Premier WebTech. All rights reserved.</p>
//         </div>
//       `,
//     });

//     res.status(201).json({ success: true, invoice });
//   } catch (err) {
//     console.error("createInvoice error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };



// const markInvoicePaid = async (req, res) => {
//   try {
//     const invoiceId = req.params.id;
//     const { paidAmount } = req.body; // This is the payment being made now
//     const invoice = await Invoice.findById(invoiceId);
//     if (!invoice) return res.status(404).json({ error: "Invoice not found" });

//     // Add the new payment to the already paid
//     const newPaidAmount = Number(invoice.paidAmount || 0) + Number(paidAmount);
//     if (newPaidAmount > invoice.totalAmount) {
//       return res.status(400).json({ error: "Total paid cannot exceed invoice total" });
//     }

//     invoice.paidAmount = newPaidAmount;
//     invoice.remainingAmount = invoice.totalAmount - newPaidAmount;

//     if (newPaidAmount === invoice.totalAmount) {
//       invoice.status = "Paid";
//       invoice.paidAt = new Date();
//     } else if (newPaidAmount > 0) {
//       invoice.status = "Partial";
//       invoice.paidAt = new Date();
//     } else {
//       invoice.status = "Pending";
//       invoice.paidAt = null;
//     }

//     await invoice.save();
//     res.json({ success: true, message: "Invoice updated", invoice });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// module.exports = { createInvoice, markInvoicePaid };
