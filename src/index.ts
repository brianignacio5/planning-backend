import App from "./app";
import config from "./config/config";

const port = config.PORT === "string" ? parseInt(config.PORT) : 3000;

const app = new App([]);

app.start(port);
