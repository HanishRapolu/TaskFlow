const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Format based on standard
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    errors: err.errors || null,
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export { errorHandler, notFound };
