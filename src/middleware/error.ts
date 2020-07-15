import { NextFunction, Request, Response } from "express";
import httpException from "../types/httpException";

export default function errorMiddleware(error: httpException, req: Request, res: Response, next: NextFunction) {
  const status = error.status || 500;
  const message = error.message || "Something went wrong";
  res.status(status).send({ message, status, stack: error.stack });
}