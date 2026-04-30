const successResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
  };
};

const errorResponse = (message = 'Error', error = null) => {
  return {
    success: false,
    message,
    error: error ? error.message : null,
  };
};

const paginatedResponse = (data, page, limit, total) => {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};