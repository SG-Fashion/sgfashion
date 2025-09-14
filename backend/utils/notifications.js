// utils/notifications.js
import nodemailer from 'nodemailer';
import Twilio from 'twilio';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: +process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const twilioClient = Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendOrderEmail(toEmail, order) {
  const html = `
    <h1>Order Received!</h1>
    <p>Hi ${order.address.firstName},</p>
    <p>Thanks for your order (<strong>${order._id}</strong>) of ₹${order.amount}.</p>
    <p>We’re getting it ready to ship to:</p>
    <address>
      ${order.address.street}, ${order.address.city},<br/>
      ${order.address.state} – ${order.address.zipcode}<br/>
      ${order.address.country}
    </address>
    <p>We’ll let you know when it ships.</p>
  `;
  await transporter.sendMail({
    from: `"Your Shop Name" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `Your Order ${order._id} Confirmation`,
    html
  });
}

// utils/notifications.js

export async function sendOrderSMS(toPhone,messageBody) {
  console.log(toPhone)

  const formattedTo = `${toPhone.replace(/^0+/, '')}`;

  console.log("⏳ Sending SMS to:", formattedTo, "→", messageBody);
  await twilioClient.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: formattedTo,
    body: messageBody
  });
}
