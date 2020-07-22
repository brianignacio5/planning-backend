import App from "./app";
import config from "./config/config";
import authController from "./controllers/authController";

const port = config.PORT === "string" ? parseInt(config.PORT) : 3000;

const app = new App([
  new authController()
]);

app.start(port);
