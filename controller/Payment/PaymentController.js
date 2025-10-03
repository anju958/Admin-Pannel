const Razorpay = require("razorpay");
const Invoice = require("../../model/Invoice/Invoice");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ----------------- SEND INVOICE -----------------
const sendInvoiceForPayment = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    if (!invoiceId) return res.status(400).json({ error: "Invoice ID is required" });

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    // Total amount in paise
    const totalAmount = Math.round(invoice.totalAmount * 100);

    // Create Razorpay payment link
    const paymentLink = await razorpay.paymentLink.create({
      amount: totalAmount,
      currency: "INR",
      description: `Invoice #${invoice.invoiceNumber}`,
      customer: { name: invoice.clientName, email: invoice.clientEmail },
      notify: { email: true },
      reminder_enable: true,
      callback_url: process.env.RAZORPAY_CALLBACK_URL, // do NOT add extra params
      callback_method: "get",
      notes: { invoiceId: invoice._id.toString() },
    });

    // Save payment info in invoice
    invoice.razorpayPaymentLink = paymentLink.short_url;
    invoice.razorpayPaymentLinkId = paymentLink.id;
    await invoice.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: invoice.clientEmail,
      subject: `Invoice #${invoice.invoiceNumber} - Payment Request (₹${(totalAmount / 100).toLocaleString()})`,
      html: `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:8px; background:#ffffff;">
    
    <!-- Company Name / Logo -->
    <h2 style="color:#007bff; margin-bottom:10px;">Premier WebTech</h2>

    <!-- Greeting -->
    <p>Dear <strong>${invoice.clientName}</strong>,</p>
    <p>Please pay your invoice <strong>#${invoice.invoiceNumber}</strong> using the secure link below:</p>

    <!-- Projects Table -->
    <table style="width:100%; border-collapse:collapse; margin:20px 0; font-size:14px;">
      <thead>
        <tr>
          <th style="border:1px solid #ddd; padding:10px; text-align:left; background:#f5f5f5;">Service/Project</th>
          <th style="border:1px solid #ddd; padding:10px; text-align:right; background:#f5f5f5;">Price (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.projects && invoice.projects.length > 0
          ? invoice.projects.map(p => `
            <tr>
              <td style="border:1px solid #ddd; padding:10px;">${p.projectName || "Unnamed Project"}</td>
              <td style="border:1px solid #ddd; padding:10px; text-align:right;">${Number(p.amount || 0).toLocaleString()}</td>
            </tr>
          `).join('')
          : `<tr><td colspan="2" style="border:1px solid #ddd; padding:10px; text-align:center;">No project details available</td></tr>`
        }
        <tr>
          <td style="border:1px solid #ddd; padding:10px; font-weight:bold;">Total</td>
          <td style="border:1px solid #ddd; padding:10px; text-align:right; font-weight:bold;">₹${(totalAmount / 100).toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <!-- Pay Now Button -->
    <div style="text-align:center; margin:25px 0;">
      <a href="${paymentLink.short_url}" target="_blank"
        style="background-color:#007bff; color:#fff; padding:12px 25px; text-decoration:none; border-radius:6px; display:inline-block; font-weight:bold;">
        Pay Now
      </a>
    </div>

    <!-- Invoice Info -->
    <p style="margin-top:15px;">
      <strong style="color:#d9534f;">Invoice due date: ${new Date(invoice.dueDate).toLocaleDateString()}</strong>
    </p>

    <!-- Footer -->
    <p>If you have any questions, contact us at 
      <a href="mailto:info@premierwebtech.com" style="color:#007bff;">info@premierwebtech.com</a>.
    </p>

    <p style="font-size:12px; color:#777; margin-top:20px;">© ${new Date().getFullYear()} Premier WebTech. All rights reserved.</p>
  </div>
  `,
    });

    console.log("✅ Email sent to client:", invoice.clientEmail);
    res.json({ success: true, paymentLink: paymentLink.short_url });
  } catch (err) {
    console.error("sendInvoiceForPayment error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ----------------- VERIFY PAYMENT -----------------
const verifyPayment = async (req, res) => {
  try {
    // Decode params to avoid URL encoding issues
    const razorpay_payment_id = decodeURIComponent(req.query.razorpay_payment_id);
    const razorpay_payment_link_id = decodeURIComponent(req.query.razorpay_payment_link_id);
    const razorpay_signature = decodeURIComponent(req.query.razorpay_signature);

    if (!razorpay_payment_id || !razorpay_payment_link_id)
      return res.status(400).json({ error: "Missing payment info" });

    // Verify signature
    const expected_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_link_id}|${razorpay_payment_id}`)
      .digest("hex");

    console.log("🔹 Received signature:", razorpay_signature);
    console.log("🔹 Expected signature:", expected_signature);

    if (expected_signature !== razorpay_signature)
      return res.status(400).json({ error: "Invalid signature" });

    // Fetch invoice ID from payment link
    const paymentLink = await razorpay.paymentLink.fetch(razorpay_payment_link_id);
    const invoiceId = paymentLink.notes?.invoiceId;
    if (!invoiceId) return res.status(400).json({ error: "No invoiceId in payment link notes" });

    // Update invoice status
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    if (invoice.status === "Paid") return res.json({ success: true, message: "Already paid" });

    invoice.status = "Paid";
    invoice.paymentId = razorpay_payment_id;
    invoice.razorpayPaymentLinkId = razorpay_payment_link_id;
    invoice.razorpaySignature = razorpay_signature;
    invoice.paidAt = new Date();
    await invoice.save();

    console.log("✅ Payment verified for invoice:", invoice.invoiceNumber);
    res.send("Payment verified successfully!");
  } catch (err) {
    console.error("verifyPayment error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { sendInvoiceForPayment, verifyPayment };
