const SERVICE_ERROR = "Something went wrong. Please try again later.";

const errorMiddleware = (err, req, res, _next) => {
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message;

  // ── Mongoose / MongoDB errors ──

  // Bad ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // Duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = field
      ? `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      : "Duplicate value entered";
  }

  // Validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join(". ");
  }

  // Buffering timeout
  if (err.name === "MongooseError" && message.includes("buffering timed out")) {
    statusCode = 503;
    message = SERVICE_ERROR;
  }

  // MongoDB network / DNS / socket errors
  if (
    err.name === "MongoNetworkError" ||
    err.name === "MongoServerSelectionError" ||
    err.name === "MongoNetworkTimeoutError" ||
    message.includes("ENOTFOUND") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("Socket") ||
    message.includes("timed out") ||
    message.includes("socket") ||
    message.includes("getaddrinfo")
  ) {
    statusCode = 503;
    message = SERVICE_ERROR;
  }

  // ── JWT errors ──
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please login again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Session expired. Please login again.";
  }

  // ── Catch-all: hide internal errors from users in production ──
  if (statusCode === 500 && process.env.NODE_ENV === "production") {
    message = SERVICE_ERROR;
  }

  // Always log 500s for debugging
  if (statusCode >= 500) {
    console.error(`[${statusCode}] ${req.method} ${req.originalUrl}:`, err.message);
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

export default errorMiddleware;
