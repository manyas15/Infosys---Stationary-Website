import nodemailer from 'nodemailer';
import twilio from 'twilio';

const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const hasTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);

let mailTransport = null;
if (hasSmtp) {
  mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

let smsClient = null;
if (hasTwilio) {
  smsClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export async function sendSuccessNotification({ toEmail, toPhone, fullName, companyName, role }) {
  const subject = 'Registration Successful';
  const text = `Hi ${fullName}, your registration as ${role} for ${companyName} was successful.`;

  const tasks = [];

  if (toEmail && hasSmtp) {
    tasks.push(
      mailTransport.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject,
        text,
      }),
    );
  }

  if (toPhone && hasTwilio) {
    tasks.push(
      smsClient.messages.create({
        from: process.env.TWILIO_FROM_NUMBER,
        to: toPhone,
        body: text,
      }),
    );
  }

  if (tasks.length === 0) {
    // Fallback to console for demo
    console.log('[Notification]', { toEmail, toPhone, subject, text });
    return;
  }

  await Promise.all(tasks);
}


