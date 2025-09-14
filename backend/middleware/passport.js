import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userModel from "../models/userModel.js";

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:4000/api/user/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    let user = await userModel.findOne({ email });
    if (!user) {
      // create new user with minimal info
      user = await new userModel({
        name: profile.displayName,
        email,
        phone: "",                // optional placeholder
        dob: new Date("1970-01-01"), // placeholder
        password: ""              // empty since Google user
      }).save();
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  userModel.findById(id).then(user => done(null, user)).catch(err => done(err));
});

export default passport;
