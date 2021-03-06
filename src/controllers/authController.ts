import { NextFunction, Router, Request, Response } from "express";
import IController from "./IController";
import userModel from "../models/user";
import { User } from "../types/user";
import jwt from "jsonwebtoken";
import config from "../config/config";
import Passport from "passport";
import HttpException from "../types/httpException";
import { isValidObjectId } from "mongoose";
import jwtTokenData from "../types/jwtTokenData";
import isAuthenticated from "../middleware/isAuthenticated";

function createToken(user: User) {
  const tokenData: jwtTokenData = {
    accessToken: user.accessToken,
    email: user.email,
    githubId: user.githubId,
    id: user._id,
    refreshToken: user.refreshToken,
  };
  return jwt.sign(tokenData, config.jwtSecret, {
    expiresIn: 86400,
  });
}

export default class AuthController implements IController {
  public path = "/auth";
  public router = Router();

  constructor() {
    this.router.get(this.path, this.redirectHome);
    this.router.get(`${this.path}/users`, this.listUsers);
    this.router.put(`${this.path}/user`, isAuthenticated, this.updateUser);
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

  private listUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const users = await userModel.find().exec();
      users
        ? res.status(201).send(users)
        : next(new HttpException(404, new Error("No users")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        next("User not found");
        return;
      }
      const dbUser = req.user as User;
      if (!req.body.email) {
        return res
          .status(400)
          .json({ msg: "Please submit email and password" });
      }

      interface userInfo {
        email?: string;
        name?: string;
        password?: string;
        picture?: string;
      }
      let userData: userInfo = {
        email: req.body.email,
        name: req.body.name,
        picture: req.body.picture
      };

      if (req.body.oldPassword) {
        const isMatch = await dbUser.comparePassword(req.body.oldPassword);
        if (isMatch) {
          userData.password = req.body.newPassword;
        } else {
          res.status(201).send({ error: "Old password is invalid"});
          return;
        }
      }
      const modifiedUser = await userModel
        .findByIdAndUpdate(dbUser._id, userData, { new: true })
        .exec();
      if (modifiedUser) {
        const planningJwt = {
          name: modifiedUser.name || modifiedUser.email,
          email: modifiedUser.email,
          picture: modifiedUser.picture,
          token: createToken(modifiedUser),
        };
        res.cookie("planningJwt", JSON.stringify(planningJwt));
      }
      modifiedUser
        ? res.status(201).send(modifiedUser)
        : next(new HttpException(404, new Error("user not modified")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.body.email || !req.body.password) {
        return res
          .status(400)
          .json({ msg: "Please submit email and password" });
      }
      const user = await userModel.findOne({ email: req.body.email }).exec();
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
      return res.sendFile(process.cwd() + "/views/frontend.html");
      // return res.redirect(config.FRONTEND_URL);
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body.email || !req.body.password) {
        return res
          .status(400)
          .json({ msg: "Please submit email and password" });
      }
      const user = await userModel.findOne({ email: req.body.email }).exec();
      if (!user) {
        return res.status(400).json({ msg: "The user doesn't exist." });
      }
      const isMatch = await user.comparePassword(req.body.password);
      if (isMatch) {
        const planningJwt = {
          name: user.name || user.email,
          email: user.email,
          picture: user.picture,
          token: createToken(user),
        };
        res.cookie("planningJwt", JSON.stringify(planningJwt));

        return res.sendFile(process.cwd() + "/views/frontend.html");
        // return res.redirect(config.FRONTEND_URL);
      }
      return res.status(400).json({ msg: "Email or password are incorrect" });
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private oauthCallback = async (req: Request, res: Response) => {
    const receivedUser = req.user as User;
    const planningJwt = {
      name: receivedUser.name,
      email: receivedUser.email,
      picture: receivedUser.picture,
      token: createToken(receivedUser),
    };
    res.cookie("planningJwt", JSON.stringify(planningJwt));
    return res.sendFile(process.cwd() + "/views/frontend.html");
    // return res.redirect(config.FRONTEND_URL);
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

  private deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.params.id || !isValidObjectId(req.params.id)) {
        return res.status(400).json({ msg: "Invalid id" });
      }
      if (!req.body.email || !req.body.password) {
        return res
          .status(400)
          .json({ msg: "Please submit email and password" });
      }
      const user = await userModel.findById(req.params.id).exec();
      if (!user) {
        return res.status(400).json({ msg: "The user doesn't exist." });
      }

      const isMatch = await user.comparePassword(req.body.password);
      if (isMatch) {
        const deletedUser = await userModel
          .findByIdAndDelete(req.params.id)
          .exec();

        return res.status(200).send(deletedUser);
      }
      return res.status(400).json({ msg: "Email or password are incorrect" });
    } catch (error) {
      next(new HttpException(404, error));
    }
  };
}
