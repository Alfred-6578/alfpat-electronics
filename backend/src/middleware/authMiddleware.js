import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    res.status(401);
    return next(new Error("Not authorized, no token"));
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password -passwordResetToken -passwordResetExpiry");

    if (!user) {
      res.status(401);
      return next(new Error("User no longer exists"));
    }

    if (user.isSuspended) {
      res.status(403);
      return next(new Error("Your account has been suspended. Contact support."));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.status(401);
      return next(new Error("Token expired, please login again"));
    }
    res.status(401);
    next(new Error("Not authorized, invalid token"));
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  res.status(403);
  next(new Error("Access denied, admins only"));
};
