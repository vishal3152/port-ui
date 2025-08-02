import { Request, Response, NextFunction } from "express";

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // If not authenticated, return 401
  res.status(401).json({ message: "Authentication required" });
}

// Middleware to check if user is NOT authenticated (for login/register pages)
export function requireNoAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return next();
  }
  
  // If already authenticated, redirect to home
  res.redirect("/");
}