import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;
        const googleId = profile.id;

        // Try to find by googleId first
        let user = await User.findOne({ googleId });

        if (!user) {
          // Try to find by email (user may have registered manually)
          user = await User.findOne({ email });

          if (user) {
            // Link Google account to existing user
            user.googleId = googleId;
            await user.save();
          } else {
            // Create brand new user
            user = await User.create({
              name,
              email,
              googleId,
              role: "user",
            });
          }
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

export default passport;
