import { Strategy } from "passport-linkedin-oauth2";
import config from "../config/config";
import userModel from "../models/user";

export default new Strategy(
  {
    clientID: config.LINKEDIN.CLIENT_ID,
    clientSecret: config.LINKEDIN.CLIENT_SECRET,
    callbackURL: "/auth/linkedin/cb"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await userModel.findOne({ linkedInId: profile.id });
      if (user) {
        return done(null, user);
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