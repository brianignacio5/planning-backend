import { NextFunction, Request, Response } from "express";
import config from "../config/config";
import jwt from "jsonwebtoken";
import HttpException from "../types/httpException";
import userModel from "../models/user";
import jwtTokenData from "../types/jwtTokenData";

export default async function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.headers.authorization) {
      const verifyResponse = jwt.verify(
        req.headers.authorization,
        config.jwtSecret
      ) as jwtTokenData;
      const user = await userModel.findById(verifyResponse.id).exec();
      if (!user) {
        next(new HttpException(404, new Error("invalid user")));
        return;
      }
      req.user = user;
      req.body.user = user._id;
      next();
    }
  } catch (error) {
    next(new HttpException(404, error));
  }
}
