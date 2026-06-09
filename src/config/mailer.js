const nodemailer = require('nodemailer');
const config = require('./config');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

async function sendMail({ to, subject, html, attachments = [] }) {
  return transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    html,
    attachments,
  });
}

module.exports = { sendMail };
