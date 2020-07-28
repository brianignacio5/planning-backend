import { Strategy } from "passport-google-oauth20";
import config from "../config/config";
import userModel from "../models/user";

export default new Strategy(
  {
    clientID: config.GOOGLE.CLIENT_ID,
    clientSecret: config.GOOGLE.CLIENT_SECRET,
    callbackURL: "/auth/google/cb",
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await userModel.findOne({ googleId: profile.id });
      if (user) {
        return done(undefined, user);
      }
      const newUserData = {
        accessToken,
        createdOn: new Date(),
        email: profile.emails ? profile.emails[0].value : "",
        googleId: profile.id,
        name: profile.displayName,
        password: "",
        picture: profile.photos ? profile.photos[0].value : "",
        provider: profile.provider,
        refreshToken,
      };
      const newUser = new userModel(newUserData);
      await newUser.save();
      return done(undefined, newUser);
    } catch (error) {
      console.log(error);
      return done(error);
    }
  }
);
