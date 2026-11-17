import nodemailer from 'nodemailer';

const EMAIL_CONFIG_KEYS = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_FROM',
];

function getEmailConfig() {
  if (EMAIL_CONFIG_KEYS.some((key) => !process.env[key])) return null;

  const port = Number(process.env.SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  if (!['true', 'false'].includes(process.env.SMTP_SECURE.toLowerCase())) return null;

  return {
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE.toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    from: process.env.SMTP_FROM,
  };
}

const passwordResetMailer = {
  isConfigured: () => getEmailConfig() !== null,

  async send(to, otp) {
    const config = getEmailConfig();
    if (!config) throw new Error('Password reset email is not configured.');

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    await transporter.sendMail({
      from: config.from,
      to,
      subject: 'Your CampusCare password reset code',
      text: `Your CampusCare verification code is ${otp}. It expires in 10 minutes. If you did not request a password reset, you can ignore this email.`,
      html: `<p>Your CampusCare verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes. If you did not request a password reset, you can ignore this email.</p>`,
    });
  },
};

export default passwordResetMailer;
