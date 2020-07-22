import { Strategy } from "passport-github";
import config from "../config/config";
import userModel from "../models/user";

export default new Strategy(
  {
    clientID: config.GITHUB.CLIENT_ID,
    clientSecret: config.GITHUB.CLIENT_SECRET,
    callbackURL: "/auth/github/cb",
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await userModel.findOne({ githubId: profile.id });
      if (user) {
        return done(null, user);
      }
      const newUserData = {
        accessToken,
        createdOn: new Date(),
        email: profile.emails ? profile.emails[0].value : "",
        githubId: profile.id,
        name: profile.displayName,
        password: profile.profileUrl,
        picture: profile.photos ? profile.photos[0].value : "",
        provider: profile.provider,
        refreshToken,
      };
      const newUser = new userModel(newUserData);
      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      console.log(error);
      return done(error);
    }
  }
);
