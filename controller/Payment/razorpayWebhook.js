const crypto = require("crypto");
const Invoice = require("../../model/Invoice/Invoice");

const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET; // Set in .env
    const signature = req.headers["x-razorpay-signature"];
    const body = JSON.stringify(req.body);

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const event = req.body.event;

    // Payment link paid event
    if (event === "payment.link.paid") {
      const payment = req.body.payload.payment.entity;
      const link = req.body.payload.payment_link.entity;

      // Find invoice by payment link
      const invoice = await Invoice.findOne({ razorpayPaymentLink: link.short_url });
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });

      // Update invoice status
      invoice.status = "Paid";
      invoice.paymentId = payment.id;
      await invoice.save();

      console.log(`Invoice ${invoice.invoiceNumber} marked as Paid`);
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { razorpayWebhook };
