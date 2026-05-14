// backend/src/routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../services/emailService');

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: name, email, subject, message',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address',
      });
    }

    // Validate message length
    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Message must be at least 10 characters long',
      });
    }

    // Respond immediately — don't block on SMTP
    res.json({
      success: true,
      message: 'Thank you! Your message has been sent successfully. We will get back to you soon.',
    });

    // Send emails in the background
    sendContactEmail(name, email, subject, message).catch((err) => {
      console.error('Contact email failed:', err.message, {
        EMAIL_USER: process.env.EMAIL_USER ? 'set' : 'MISSING',
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'set' : 'MISSING',
        SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
      });
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message. Please try again later.',
    });
  }
});

module.exports = router;