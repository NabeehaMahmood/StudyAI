// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true', // false for TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('✓ Email service ready');
  }
});

// Send contact form email
const sendContactEmail = async (name, email, subject, message) => {
  try {
    const adminEmailContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><small>This is an automated email from AI Study Assistant contact form.</small></p>
    `;

    const userConfirmationEmail = `
      <h2>We received your message</h2>
      <p>Hi ${name},</p>
      <p>Thank you for reaching out to AI Study Assistant. We've received your message and will get back to you as soon as possible.</p>
      <p><strong>Your Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p>Best regards,<br>AI Study Assistant Team</p>
    `;

    // Send email to admin
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `[Contact Form] ${subject}`,
      html: adminEmailContent,
      replyTo: email,
    });

    // Send confirmation email to user
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_EMAIL}>`,
      to: email,
      subject: 'We received your message - AI Study Assistant',
      html: userConfirmationEmail,
    });

    console.log(`✓ Contact email sent from ${email} to ${process.env.ADMIN_EMAIL}`);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending contact email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  try {
    const emailContent = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your AI Study Assistant account.</p>
      <p>Click the link below to reset your password (valid for 24 hours):</p>
      <p><a href="${resetUrl}" style="background-color: #22D3EE; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
      <p>Or copy this link: ${resetUrl}</p>
      <hr>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>AI Study Assistant Team</p>
    `;

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_EMAIL}>`,
      to: email,
      subject: 'Password Reset - AI Study Assistant',
      html: emailContent,
    });

    console.log(`✓ Password reset email sent to ${email}`);
    return { success: true, message: 'Reset email sent' };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error(`Failed to send reset email: ${error.message}`);
  }
};

// Send welcome email
const sendWelcomeEmail = async (name, email) => {
  try {
    const emailContent = `
      <h2>Welcome to AI Study Assistant!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for signing up for AI Study Assistant. We're excited to help you with your learning journey!</p>
      <h3>Getting Started:</h3>
      <ol>
        <li>Log in to your account</li>
        <li>Upload your study documents (PDF, DOCX, TXT)</li>
        <li>Ask questions about your documents</li>
        <li>Get AI-powered answers grounded in your content</li>
      </ol>
      <h3>Features:</h3>
      <ul>
        <li>📚 Document-based Q&A with RAG technology</li>
        <li>🔒 100% private - all processing is local</li>
        <li>⚡ Fast AI responses powered by local LLM</li>
        <li>📊 Organized document management</li>
      </ul>
      <p>If you have any questions, feel free to <a href="https://study-assistant.app/contact">contact us</a>.</p>
      <hr>
      <p>Best regards,<br>AI Study Assistant Team</p>
    `;

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_EMAIL}>`,
      to: email,
      subject: 'Welcome to AI Study Assistant!',
      html: emailContent,
    });

    console.log(`✓ Welcome email sent to ${email}`);
    return { success: true, message: 'Welcome email sent' };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

// Send admin notification email
const sendAdminNotification = async (subject, message, metadata = {}) => {
  try {
    const emailContent = `
      <h2>${subject}</h2>
      <p>${message}</p>
      ${
        Object.keys(metadata).length > 0
          ? `
        <h3>Details:</h3>
        <ul>
          ${Object.entries(metadata)
            .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
            .join('')}
        </ul>
      `
          : ''
      }
      <hr>
      <p><small>This is an automated system notification from AI Study Assistant.</small></p>
    `;

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `[System Notification] ${subject}`,
      html: emailContent,
    });

    console.log(`✓ Admin notification email sent`);
    return { success: true };
  } catch (error) {
    console.error('Error sending admin notification:', error);
    throw new Error(`Failed to send notification: ${error.message}`);
  }
};

module.exports = {
  transporter,
  sendContactEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAdminNotification,
};
