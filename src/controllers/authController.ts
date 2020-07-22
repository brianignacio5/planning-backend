import { NextFunction, Router, Request, Response } from "express";
import IController from "./IController";
import userModel from "../models/user";
import { User } from "../types/user";
import jwt from "jsonwebtoken";
import config from "../config/config";
import Passport from "passport";

function createToken(user: User) {
  return jwt.sign(
    {
      accessToken: user.accessToken,
      email: user.email,
      githubId: user.githubId,
      id: user.id,
      refreshToken: user.refreshToken,
    },
    config.jwtSecret,
    {
      expiresIn: 86400,
    }
  );
}

export default class AuthController implements IController {
  public path = "/auth";
  public router = Router();

  constructor() {
    this.router.get(this.path, this.redirectHome);
    this.router.get(`${this.path}/logout`, this.logout);
    this.router.post(`${this.path}/signin`, this.login);
    this.router.post(`${this.path}/signup`, this.register);
    this.router.get(`${this.path}/github`, function(req, res, next) {
      if (req.session) {
        req.session.url = req.query.url;
      }
      next();
    }, Passport.authenticate("github"));
    this.router.get(
      `${this.path}/github/cb`,
      Passport.authenticate("github", { failureRedirect: "/signin" }),
      (req: Request, res: Response) => {
        const receivedUser = req.user as User;
        return res.status(201).json({
          name: receivedUser.name,
          picture: receivedUser.picture,
          token: createToken(receivedUser),
        });
      }
    );
  }

  private register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ msg: "Please submit email and password" });
    }
    const user = await userModel.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json({ json: "User already exists" });
    }

    const newUser = new userModel(req.body);
    await newUser.save();
    return res.status(201).json(newUser);
  };

  private login = async (req: Request, res: Response) => {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ msg: "Please submit email and password" });
    }
    const user = await userModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ msg: "The user doesn't exist." });
    }

    const isMatch = await user.comparePassword(req.body.password);
    if (isMatch) {
      return res.status(201).json({
        name: user.name,
        picture: user.picture,
        token: createToken(user),
      });
    }
    return res.status(400).json({ msg: "Email or password are incorrect" });
  };

  private logout = async (req: Request, res: Response) => {
    req.logOut();
    return res.status(201).json({ msg: "The user has logged out." });
  };

  private redirectHome = (req: Request, res: Response) => {
    return res.redirect("/");
  };
}
