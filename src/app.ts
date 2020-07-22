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
      origin: "*"
    }
    this.App.use(cors());
    this.App.use(express.json());
    this.App.use(express.urlencoded({ extended: false }));
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
    this.App.use(session({
      secret: config.jwtSecret,
      resave: true,
      saveUninitialized: true,
    }));
    this.App.use(Passport.initialize());
    this.App.use(Passport.session());
    Passport.use(githubStrategy);
    Passport.serializeUser(function(user, done) {
      done(null, user);
    });
    
    Passport.deserializeUser(function(user, done) {
      done(null, user);
    });
  }

  async start(port: number) {
    await connectToDB();
    this.App.listen(port, () => {
      console.log(`Planning App is listening to ${port}.`);
    });
  }
}

export default PlanningApp;