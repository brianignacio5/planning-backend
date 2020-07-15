import { NextFunction, Request, Response } from "express";

export default function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}
