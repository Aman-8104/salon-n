const nodemailer = require('nodemailer');

function createTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || SMTP_HOST.includes('example.com')) {
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: false,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

const transporter = createTransport();

async function sendBookingConfirmation({ to, name, serviceName, startTime, barberName }) {
  const from = process.env.MAIL_FROM || 'Mens Salon <no-reply@menssalon.local>';
  const subject = `Your booking is confirmed — ${serviceName}`;
  const when = new Date(startTime).toLocaleString();
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto;line-height:1.4">
      <h2>Thanks for booking, ${name}!</h2>
      <p>Your appointment details:</p>
      <ul>
        <li><strong>Service:</strong> ${serviceName}</li>
        <li><strong>Barber:</strong> ${barberName}</li>
        <li><strong>Time:</strong> ${when}</li>
        <li><strong>Location:</strong> Thane, Maharashtra</li>
      </ul>
  <p>See you soon,<br/>Mens Salon</p>
    </div>
  `;
  const info = await transporter.sendMail({ from, to, subject, html });
  return info;
}

async function sendCancellationNotification({ to, name, serviceName, startTime, barberName }) {
  const from = process.env.MAIL_FROM || 'Mens Salon <no-reply@menssalon.local>';
  const subject = `Your booking was cancelled — ${serviceName}`;
  const when = new Date(startTime).toLocaleString();
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto;line-height:1.4">
      <h2>Hello ${name},</h2>
      <p>This appointment has been cancelled:</p>
      <ul>
        <li><strong>Service:</strong> ${serviceName}</li>
        <li><strong>Barber:</strong> ${barberName}</li>
        <li><strong>Time:</strong> ${when}</li>
        <li><strong>Location:</strong> Thane, Maharashtra</li>
      </ul>
      <p>If this was a mistake, please rebook on our website.</p>
      <p>— Mens Salon</p>
    </div>
  `;
  const info = await transporter.sendMail({ from, to, subject, html });
  return info;
}

module.exports = { sendBookingConfirmation, sendCancellationNotification };
