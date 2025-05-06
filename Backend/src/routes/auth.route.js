import express from "express";
import passport from 'passport';
import { login, logout, signup, updateProfile, checkAuth, googleLogin} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { generateToken } from "../lib/utils.js"; 

const router = express.Router();

router.post('/signup', signup)
router.post('/login', login)
router.post('/logout', logout)

router.put('/update-profile',protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth)

router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
      generateToken(req.user._id, res);
      const redirectUrl = process.env.NODE_ENV === "production" 
      ? "https://chat-app-0mh4.onrender.com" 
      : "http://localhost:5173";
      res.redirect(`${redirectUrl}?logged_in=true`); 
    }
  );
  


export default router;