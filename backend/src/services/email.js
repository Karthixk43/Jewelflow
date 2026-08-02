const nodemailer = require('nodemailer');

const isEmailConfigured = () => Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASSWORD &&
  process.env.SMTP_FROM
);

const getTransport = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

const sendPasswordResetEmail = async ({ to, name, shopName, token }) => {
  const appUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const resetUrl = `${appUrl}/admin/reset-password?token=${encodeURIComponent(token)}`;

  await getTransport().sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Reset your ${shopName} JewelFlow password`,
    text: `Hello ${name},\n\nUse this link to reset your JewelFlow password: ${resetUrl}\n\nThis link expires in one hour. If you did not request a password reset, you can safely ignore this email.`,
    html: `<p>Hello ${name},</p><p>Use the button below to reset your JewelFlow password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in one hour. If you did not request it, you can safely ignore this email.</p>`
  });
};

module.exports = { isEmailConfigured, sendPasswordResetEmail };
