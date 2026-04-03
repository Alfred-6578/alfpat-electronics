import nodemailer from "nodemailer";

function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, html, text }) {
  try {
    await transporter.sendMail({
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
    return true;
  } catch (error) {
    console.error("Email send failed:", error.message);
    return false;
  }
}

function ctaButton(text, url) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto">
      <tr>
        <td align="center" style="border-radius:50px;background:#F97316">
          <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:50px;background:#F97316;font-family:Arial,sans-serif">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

function baseTemplate(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>ALFPAT ELECTRONICS</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#F3F4F6">
    <tr>
      <td align="center" style="padding:24px 16px">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%">

          <!-- Header -->
          <tr>
            <td style="background:#0B1B3A;padding:24px;text-align:center;border-radius:12px 12px 0 0">
              <p style="margin:0;font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:1px">ALFPAT ELECTRONICS</p>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.7)">Quality Electronics for Every Home</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background:#ffffff;padding:40px 32px">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8F9FA;padding:20px;text-align:center;border-radius:0 0 12px 12px">
              <p style="margin:0;font-size:12px;color:#9CA3AF">&copy; 2025 ALFPAT ELECTRONICS &mdash; Port Harcourt, Nigeria</p>
              <p style="margin:6px 0 0;font-size:11px;color:#D1D5DB">You received this email because you have an account with us.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ━━━━━━ Exported functions ━━━━━━

export async function sendVerificationEmail({ name, email, token }) {
  const url = `${process.env.CLIENT_URL}/auth/verify-email?token=${token}`;

  const html = baseTemplate(`
    <h2 style="color:#0B1B3A;margin:0 0 8px">Hi ${name},</h2>
    <p style="color:#6B7280;margin:0 0 12px">
      Thanks for creating an account with ALFPAT ELECTRONICS!
    </p>
    <p style="color:#374151;margin:0 0 4px">
      Please verify your email address to activate your account and start shopping.
    </p>
    ${ctaButton("Verify My Email Address", url)}
    <p style="color:#9CA3AF;font-size:14px;margin:24px 0 0">
      This link expires in <strong>24 hours</strong>.
    </p>
    <p style="color:#9CA3AF;font-size:13px;margin:8px 0 0">
      If you didn&rsquo;t create this account, you can safely ignore this email.
    </p>
  `);

  const text = `Hi ${name}, verify your ALFPAT ELECTRONICS account here: ${url}\nThis link expires in 24 hours.`;

  return sendEmail({
    to: email,
    subject: "Verify your ALFPAT ELECTRONICS account",
    html,
    text,
  });
}

export async function sendPasswordResetEmail({ name, email, token }) {
  const url = `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`;

  const html = baseTemplate(`
    <h2 style="color:#0B1B3A;margin:0 0 8px">Hi ${name},</h2>
    <p style="color:#6B7280;margin:0 0 12px">
      We received a request to reset your password.
    </p>
    <p style="color:#374151;margin:0 0 4px">
      Click the button below to create a new password.
      This link is valid for <strong>1 hour</strong> only.
    </p>
    ${ctaButton("Reset My Password", url)}
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px">
      <tr>
        <td style="background:#FEF9C3;border:1px solid #FDE68A;border-radius:8px;padding:16px">
          <p style="margin:0;font-size:14px;color:#92400E">
            &#9888;&#65039; If you didn&rsquo;t request a password reset, please ignore this email. Your password will not change.
          </p>
        </td>
      </tr>
    </table>
    <p style="color:#9CA3AF;font-size:13px;margin:24px 0 0">
      This link expires in <strong>1 hour</strong>.
    </p>
  `);

  const text = `Hi ${name}, reset your password here: ${url}\nThis link expires in 1 hour.\nIf you did not request this, ignore this email.`;

  return sendEmail({
    to: email,
    subject: "Reset your ALFPAT ELECTRONICS password",
    html,
    text,
  });
}

export async function sendOrderConfirmationEmail({ name, email, order }) {
  const orderId = order._id.toString().slice(0, 8).toUpperCase();
  const orderUrl = `${process.env.CLIENT_URL}/orders/${order._id}`;

  const itemRows = order.items
    .map(
      (item, i) => `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#F9FAFB"}">
        <td style="padding:10px 12px;font-size:14px;color:#374151;border-bottom:1px solid #F3F4F6">${item.name}</td>
        <td style="padding:10px 12px;font-size:14px;color:#374151;border-bottom:1px solid #F3F4F6;text-align:center">${item.qty}</td>
        <td style="padding:10px 12px;font-size:14px;color:#374151;border-bottom:1px solid #F3F4F6;text-align:right">${formatNaira(item.price * item.qty)}</td>
      </tr>`
    )
    .join("");

  const addr = order.shippingAddress;

  const html = baseTemplate(`
    <!-- Success banner -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
      <tr>
        <td style="background:#DCFCE7;border-radius:12px;padding:20px;text-align:center">
          <p style="margin:0;font-size:20px;font-weight:bold;color:#22C55E">&#10003; Order Confirmed!</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6B7280">Your order has been received</p>
        </td>
      </tr>
    </table>

    <h2 style="color:#0B1B3A;margin:0 0 8px">Hi ${name},</h2>
    <p style="color:#6B7280;margin:0 0 24px">
      Great news! Your order has been placed successfully and our team has been notified.
      We will contact you shortly to confirm delivery.
    </p>

    <!-- Order table -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">
      <tr style="background:#F3F4F6">
        <th style="padding:12px;text-align:left;font-size:14px;color:#374151">Item</th>
        <th style="padding:12px;text-align:center;font-size:14px;color:#374151">Qty</th>
        <th style="padding:12px;text-align:right;font-size:14px;color:#374151">Price</th>
      </tr>
      ${itemRows}
      <tr style="background:#F3F4F6">
        <td colspan="2" style="padding:12px;font-size:14px;font-weight:bold;color:#374151">Total</td>
        <td style="padding:12px;font-size:16px;font-weight:bold;color:#F97316;text-align:right">${formatNaira(order.totalAmount)}</td>
      </tr>
    </table>

    <!-- Delivery address -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px">
      <tr>
        <td style="background:#F8FAFC;border-radius:8px;padding:20px">
          <p style="margin:0 0 8px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px">Delivery Address</p>
          <p style="margin:0 0 4px;font-size:15px;font-weight:bold;color:#0B1B3A">${addr.fullName}</p>
          <p style="margin:0 0 2px;font-size:14px;color:#6B7280">${addr.phone}</p>
          <p style="margin:0;font-size:14px;color:#6B7280">${addr.street}, ${addr.city}, ${addr.state}</p>
        </td>
      </tr>
    </table>

    <p style="color:#F97316;font-size:14px;margin:16px 0 0">
      &#128241; We will contact you on ${addr.phone} via WhatsApp to arrange delivery.
    </p>

    ${ctaButton("View Order Details", orderUrl)}
  `);

  const text = `Hi ${name}, your ALFPAT order #${orderId} has been confirmed.\nTotal: ${formatNaira(order.totalAmount)}. Delivery to: ${addr.city}, ${addr.state}.\nView order: ${orderUrl}`;

  return sendEmail({
    to: email,
    subject: `Order Confirmed ✓ — #${orderId}`,
    html,
    text,
  });
}
