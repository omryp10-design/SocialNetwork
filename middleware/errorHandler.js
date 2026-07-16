function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

// Central error handler - guarantees the server always answers with clean JSON
// instead of crashing, no matter what kind of error was thrown anywhere above.
function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  const payload = { message: error.message || 'Server error' };

  if (error.name === 'ValidationError') {
    payload.message = Object.values(error.errors).map((item) => item.message).join(', ');
    return res.status(400).json(payload);
  }

  if (error.code === 11000) {
    payload.message = `Duplicate value for: ${Object.keys(error.keyValue).join(', ')}`;
    return res.status(409).json(payload);
  }

  if (error.name === 'CastError') {
    payload.message = 'Invalid identifier';
    return res.status(400).json(payload);
  }

  if (status >= 500) console.error(error);
  return res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
