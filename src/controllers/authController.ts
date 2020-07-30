import { NextFunction, Router, Request, Response } from "express";
import IController from "./IController";
import userModel from "../models/user";
import { User } from "../types/user";
import jwt from "jsonwebtoken";
import config from "../config/config";
import Passport from "passport";
import boardModel from "../models/board";

function createToken(user: User) {
  return jwt.sign(
    {
      accessToken: user.accessToken,
      email: user.email,
      githubId: user.githubId,
      id: user._id,
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
    this.router.delete(`${this.path}/:id`, this.deleteUser);
    this.router.get(
      `${this.path}/github`,
      this.saveUrlMiddleware,
      Passport.authenticate("github")
    );
    this.router.get(
      `${this.path}/google`,
      this.saveUrlMiddleware,
      Passport.authenticate("google", { scope: ["email", "profile"] })
    );
    this.router.get(
      `${this.path}/linkedin`,
      this.saveUrlMiddleware,
      Passport.authenticate("linkedin", {
        scope: ["r_emailaddress", "r_liteprofile"],
      })
    );
    this.router.get(
      `${this.path}/github/cb`,
      Passport.authenticate("github", { failureRedirect: this.path }),
      this.oauthCallback
    );
    this.router.get(
      `${this.path}/google/cb`,
      Passport.authenticate("google", { failureRedirect: this.path }),
      this.oauthCallback
    );
    this.router.get(
      `${this.path}/linkedin/cb`,
      Passport.authenticate("linkedin", { failureRedirect: this.path }),
      this.oauthCallback
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
    const planningJwt = {
      name: newUser.email,
      picture: newUser.picture,
      token: createToken(newUser),
    };
    res.cookie("planningJwt", JSON.stringify(planningJwt));
    return res.redirect(config.FRONTEND_URL);
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
      const planningJwt = {
        name: user.name || user.email,
        picture: user.picture,
        token: createToken(user),
      };
      res.cookie("planningJwt", JSON.stringify(planningJwt));
      return res.redirect(config.FRONTEND_URL);
    }
    return res.status(400).json({ msg: "Email or password are incorrect" });
  };

  private oauthCallback = async (req: Request, res: Response) => {
    const receivedUser = req.user as User;
    const planningJwt = {
      name: receivedUser.name,
      picture: receivedUser.picture,
      token: createToken(receivedUser),
    };
    res.cookie("planningJwt", JSON.stringify(planningJwt));
    return res.redirect(config.FRONTEND_URL);
  };

  private logout = async (req: Request, res: Response) => {
    req.logOut();
    return res.status(201).json({ msg: "The user has logged out." });
  };

  private redirectHome = (req: Request, res: Response) => {
    return res.sendFile(process.cwd() + "/views/login.html");
  };

  private saveUrlMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (req.session) {
      req.session.url = req.query.url;
    }
    next();
  };

  private deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.id) {
      return res.status(400).json({ msg: "Invalid id" });
    }
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ msg: "Please submit email and password" });
    }
    const user = await userModel.findById(req.params.id).exec();
    if (!user) {
      return res.status(400).json({ msg: "The user doesn't exist." });
    }

    const isMatch = await user.comparePassword(req.body.password);
    if (isMatch) {
      const deletedUser = await userModel.findByIdAndDelete(req.params.id).exec();
      const board = await boardModel.deleteMany({ user: deletedUser?._id }).exec();
    }
    return res.status(400).json({ msg: "Email or password are incorrect" });
  }
}
