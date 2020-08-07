import App from "./app";
import config from "./config/config";
import authController from "./controllers/authController";
import boardController from "./controllers/boardController";
import cardController from "./controllers/cardsController";
import commentController from "./controllers/commentController";
import projectController from "./controllers/projectController";

const port = config.PORT === "string" ? parseInt(config.PORT) : 3000;

const app = new App([
  new authController(),
  new boardController(),
  new cardController(),
  new commentController(),
  new projectController()
]);

app.start(port);
