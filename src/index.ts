import App from "./app";
import config from "./config/config";
import authController from "./controllers/authController";
import boardController from "./controllers/boardController";
import cardController from "./controllers/cardsController";

const port = config.PORT === "string" ? parseInt(config.PORT) : 3000;

const app = new App([
  new authController(),
  new boardController(),
  new cardController(),
]);

app.start(port);
