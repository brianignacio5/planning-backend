import express, { Application } from "express";
import Passport from "passport";
import IController from "./controllers/IController";
import errorMiddleware from "./middleware/error";
import loggerMiddleware from "./middleware/logger";
import { connectToDB } from "./dbConnection";
import session from "express-session";
import githubStrategy from "./middleware/githubStrategy";
import config from "./config/config";
import cors from "cors";
import cookieParser from "cookie-parser";

class PlanningApp {
  public App: Application;

  constructor(controllers: IController[]) {
    this.App = express();
    this.config();
    this.setMiddlewares();
    this.setPassport();
    this.setRoutes(controllers);
  }

  config() {
    const corsOptions: cors.CorsOptions = {
      origin: true,
      credentials: true
    }
    this.App.use(cors(corsOptions));
    this.App.use(express.json());
    this.App.use(express.urlencoded({ extended: false }));
    this.App.use(express.static(process.cwd() + "/public"));
  }

  setRoutes(controllers: IController[]){
    for (const controller of controllers) {
      this.App.use("/", controller.router);
    }
  }

  setMiddlewares() {
    this.App.use(loggerMiddleware);
    this.App.use(errorMiddleware);
  }

  setPassport() {
    this.App.use(cookieParser());
    this.App.use(session({
      secret: config.jwtSecret,
      resave: true,
      saveUninitialized: true,
      cookie: {
        domain: "localhost"
      }
    }));
    Passport.use(githubStrategy);
    Passport.serializeUser(function(user, done) {
      done(null, user);
    });
    
    Passport.deserializeUser(function(user, done) {
      done(null, user);
    });
    this.App.use(Passport.initialize());
    this.App.use(Passport.session());
  }

  async start(port: number) {
    await connectToDB();
    this.App.listen(port, () => {
      console.log(`Planning App is listening to ${port}.`);
    });
  }
}

export default PlanningApp;