import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models//user.model.js';
import bcrypt from 'bcrypt';

const callbackURL = process.env.NODE_ENV === "production"
  ? "https://chat-app-0mh4.onrender.com/api/auth/google/callback"  
  : "http://localhost:3000/api/auth/google/callback";

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const fullName = profile.displayName;
      const picture = profile.photos[0].value;
      const googleId = profile.id;

      let user = await User.findOne({ email });

      if(user) {
        if(!user.googleId) {
          user.googleId = googleId;
          await user.save();
        }
      } else {
        const randomPassword = Math.random().toString(36).slice(-12);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        user = new User({
          fullName,
          email,
          password: hashedPassword,
          googleId,
          profilePic: picture
        });

        await user.save();
      }

      return done(null, user);
    } catch(err) {
      return done(err, null);
    }
  }
));

