import mongoose from "mongoose";
import config from "./config/config";

export async function connectToDB() {
  try {
    const dbOptions: mongoose.ConnectionOptions = {
      useFindAndModify: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      user: config.DB.USER,
      pass: config.DB.PASSWORD
    }
    await mongoose.connect(config.DB.URI, dbOptions);
    console.log(`Successfully connect to DB ${config.DB.URI}`);
  } catch (error) {
    console.log("Error connecting to DB", error);
  }
}