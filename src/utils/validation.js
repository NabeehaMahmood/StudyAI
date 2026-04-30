const validateDocumentUpload = (file) => {
  const ALLOWED_TYPES = ['application/pdf'];
  const MAX_SIZE = 50 * 1024 * 1024;

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return { valid: false, error: 'Invalid file type. Only PDF files are allowed' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }

  return { valid: true };
};

const validateChatMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }

  if (message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (message.length > 4000) {
    return { valid: false, error: 'Message exceeds maximum length' };
  }

  return { valid: true };
};

module.exports = {
  validateDocumentUpload,
  validateChatMessage,
};