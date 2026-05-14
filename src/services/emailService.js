// backend/src/services/emailService.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = `${process.env.EMAIL_FROM_NAME || 'AI Study Assistant'} <${process.env.EMAIL_FROM_EMAIL || 'onboarding@resend.dev'}>`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nabeehamahmood7@gmail.com';

const sendResend = async (payload) => {
  const { data, error } = await resend.emails.send(payload);
  if (error) {
    console.error('Resend API error:', JSON.stringify(error));
    throw new Error(error.message || 'Resend rejected the email');
  }
  return data;
};

const sendContactEmail = async (name, email, subject, message) => {
  const htmlBody = message.replace(/\n/g, '<br>');

  await sendResend({
    from: FROM,
    to: ADMIN_EMAIL,
    replyTo: email,
    subject: `[Contact Form] ${subject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${htmlBody}</p>
      <hr>
      <p><small>Sent via AI Study Assistant contact form.</small></p>
    `,
  });

  await sendResend({
    from: FROM,
    to: email,
    subject: 'We received your message - AI Study Assistant',
    html: `
      <h2>We received your message</h2>
      <p>Hi ${name},</p>
      <p>Thank you for reaching out. We'll get back to you as soon as possible.</p>
      <p><strong>Your message:</strong></p>
      <p>${htmlBody}</p>
      <hr>
      <p>Best regards,<br>AI Study Assistant Team</p>
    `,
  });

  console.log(`Contact email sent from ${email}`);
  return { success: true };
};

const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  await sendResend({
    from: FROM,
    to: email,
    subject: 'Password Reset - AI Study Assistant',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password (valid for 10 minutes):</p>
      <p><a href="${resetUrl}" style="background:#22D3EE;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">Reset Password</a></p>
      <p>Or copy: ${resetUrl}</p>
      <hr>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });

  console.log(`Password reset email sent to ${email}`);
  return { success: true };
};

const sendWelcomeEmail = async (name, email) => {
  await sendResend({
    from: FROM,
    to: email,
    subject: 'Welcome to AI Study Assistant!',
    html: `
      <h2>Welcome to AI Study Assistant!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for signing up. Upload your study documents and start asking questions!</p>
      <hr>
      <p>Best regards,<br>AI Study Assistant Team</p>
    `,
  });

  console.log(`Welcome email sent to ${email}`);
  return { success: true };
};

const sendAdminNotification = async (subject, message, metadata = {}) => {
  const metaHtml = Object.keys(metadata).length
    ? `<ul>${Object.entries(metadata).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('')}</ul>`
    : '';

  await sendResend({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[System Notification] ${subject}`,
    html: `<h2>${subject}</h2><p>${message}</p>${metaHtml}<hr><small>Automated notification from AI Study Assistant.</small>`,
  });

  return { success: true };
};

module.exports = {
  sendContactEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAdminNotification,
};
