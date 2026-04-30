module.exports = {
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
  ERROR_MESSAGES: {
    FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
    INVALID_FILE_TYPE: 'Invalid file type. Only PDF files are allowed',
    UPLOAD_FAILED: 'Failed to upload file',
    PROCESSING_FAILED: 'Failed to process document',
  },
  CHUNK_CONFIG: {
    DEFAULT_SIZE: 800,
    DEFAULT_OVERLAP: 200,
  },
  RAG_CONFIG: {
    DEFAULT_TOP_K: 4,
    DEFAULT_TEMPERATURE: 0.1,
    DEFAULT_MAX_TOKENS: 2048,
  },
};