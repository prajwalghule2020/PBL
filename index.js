const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session'); // For session management
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { userRouter } = require('./routes/user');
const { eventRouter } = require('./routes/event');

const app = express();

// ✅ CORS Configuration
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL (Vite default)
  credentials: true,              // Allow cookies/auth headers
}));

// ✅ Middleware for JSON parsing
app.use(express.json());

// ✅ Session Middleware (required for Passport)
app.use(session({
  secret: 'your-session-secret', // Replace with a strong secret
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// ✅ Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ MongoDB User Schema
const UserSchema = new mongoose.Schema({
  googleId: { type: String, unique: true },
  email: { type: String, required: true },
  username: { type: String, required: true },
  role: { type: String, default: 'user' } // Optional: Add role if needed
});
const User = mongoose.model('User', UserSchema);

// ✅ Passport Google Strategy Configuration
passport.use(new GoogleStrategy({
  clientID: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your Client ID
  clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET', // Replace with your Client Secret
  callbackURL: 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Find or create user in MongoDB
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        username: profile.displayName
      }).save();
    }
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// ✅ Serialize and Deserialize User for Sessions
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ✅ Define Routes
app.use('/user', userRouter);
app.use('/event', eventRouter);

// ✅ Google Authentication Routes
app.get('/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login' }),
  (req, res) => {
    // Redirect to frontend dashboard on success
    res.redirect('http://localhost:5173/dashboard');
  }
);

// ✅ Get Current User (Protected Route)
app.get('/api/get-user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      id: req.user._id,
      email: req.user.email,
      username: req.user.username,
      role: req.user.role,
      message: 'User data fetched successfully!'
    });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// ✅ Logout Route
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.redirect('http://localhost:5173/');
  });
});

// ✅ Connect to MongoDB
mongoose.connect('mongodb+srv://prajwalghule2020:PrajwaL321@cluster0.fh11i.mongodb.net/event-manager')
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  });

// ✅ Start Server with Error Handling
const PORT = 3000;
app.listen(PORT, (error) => {
  if (error) {
    console.error('❌ Server Start Error:', error);
    return;
  }
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong on the server' });
});