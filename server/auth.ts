import express, { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { storage } from "./storage";
import session from "express-session";
import { User } from "./storage";

// Configure Google OAuth strategy only if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
      },
      async (accessToken: string, refreshToken: string, profile: Profile, done: (error: any, user?: any) => void) => {
        try {
          // Check if user already exists
          let user = await storage.getUserByGoogleId(profile.id);
          
          if (!user) {
            // Create new user if doesn't exist
            user = await storage.createUser({
              googleId: profile.id,
              email: profile.emails?.[0].value || "",
              name: profile.displayName,
              picture: profile.photos?.[0].value || "",
            });
          }
          
          // Update user's access token
          await storage.updateUserToken(user.id, accessToken);
          
          return done(null, user);
        } catch (error) {
          return done(error as Error, false);
        }
      }
    )
  );
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const authRouter = express.Router();

// Initialize session middleware
authRouter.use(session({
  secret: process.env.SESSION_SECRET || "portfolio-tracker-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport middleware
authRouter.use(passport.initialize());
authRouter.use(passport.session());

// Error handling middleware
authRouter.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Authentication error:", err);
  res.status(500).json({ message: "Authentication failed", error: err.message });
});

// Google OAuth routes
authRouter.get(
  "/auth/google",
  (req: Request, res: Response, next: NextFunction) => {
    // Check if environment variables are set
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({
        message: "Google OAuth not configured properly. Please check environment variables."
      });
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get(
  "/auth/google/callback",
  (req: Request, res: Response, next: NextFunction) => {
    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({
        message: "Google OAuth not configured properly. Please check environment variables."
      });
    }
    // Check if GoogleStrategy is configured
    if (!passport._strategies || !passport._strategies.google) {
      return res.status(500).json({
        message: "Google OAuth strategy not configured. Please check environment variables."
      });
    }
    next();
  },
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req: Request, res: Response) => {
    // Successful authentication, redirect to home
    res.redirect("/");
  }
);

// Get current user
authRouter.get("/auth/me", (req: Request, res: Response) => {
  if (req.user) {
    // Return user data without sensitive information
    const { id, email, name, picture } = req.user as User;
    res.json({ id, email, name, picture });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// Logout route
authRouter.post("/auth/logout", (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    if (req.session) {
      req.session.destroy(() => {});
    }
    res.json({ message: "Logged out successfully" });
  });
});

export default authRouter;