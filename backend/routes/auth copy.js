const express = require('express');
const passport = require('passport');
const strapiService = require('../services/strapi');
const { generateToken, authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Regular email/password registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Register user in Strapi
    const strapiResponse = await strapiService.register({
      name,
      email,
      password,
      provider: 'email'
    });

    // Generate our application token
    const token = generateToken(strapiResponse.user.id);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: strapiResponse.user.id,
        strapiId: strapiResponse.user.id,
        name: strapiResponse.user.username,
        email: strapiResponse.user.email,
        provider: 'email'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Regular email/password login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Authenticate with Strapi
    const strapiResponse = await strapiService.authenticate(email, password);

    // Generate our application token
    const token = generateToken(strapiResponse.user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: strapiResponse.user.id,
        strapiId: strapiResponse.user.id,
        name: strapiResponse.user.username,
        email: strapiResponse.user.email,
        provider: strapiResponse.user.provider || 'email'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google'));

router.get('/google/callback', 
  (req, res, next) => {
    console.log('🔗 Google OAuth callback received');
    console.log('Query parameters:', req.query);
    console.log('Code:', req.query.code);
    next();
  },
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`
  }),
  async (req, res) => {
    try {
      console.log('✅ Google OAuth successful, user:', req.user);
      
      const token = generateToken(req.user.id);
      
      console.log('🔑 Generated token for user:', req.user.id);
      
      // Redirect to frontend with token
      const redirectUrl = `${process.env.CLIENT_URL}/auth/success?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`;
      console.log('🔄 Redirecting to:', redirectUrl);
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ Google OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=callback_failed`);
    }
  }
);

// Facebook OAuth routes
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`
  }),
  async (req, res) => {
    try {
      console.log('Facebook OAuth callback received user:', req.user);
      const token = generateToken(req.user.id);
      
      // Redirect to frontend with token
      res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
    } catch (error) {
      console.error('Facebook OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }
  }
);

// // Get current user
// router.get('/me', authMiddleware, async (req, res) => {
//   try {
//     // Get user data from Strapi
//     const strapiUser = await strapiService.getUserById(req.user.userId);
    
//     const user = {
//       id: strapiUser.id,
//       strapiId: strapiUser.id,
//       name: strapiUser.username,
//       email: strapiUser.email,
//       provider: strapiUser.provider || 'email'
//     };

//     res.json({ user });
//   } catch (error) {
//     console.error('Get user error:', error);
//     res.status(404).json({ error: 'User not found' });
//   }
// });
// Get current user

router.get('/me', authMiddleware, async (req, res) => {
  try {
    // Get user data from Strapi
    const strapiUser = await strapiService.getUserById(req.user.userId);
    
    const user = {
      id: strapiUser.id,
      strapiId: strapiUser.id,
      name: strapiUser.name || strapiUser.username,
      email: strapiUser.email,
      provider: strapiUser.provider_name || strapiUser.provider || 'email',
      avatar: strapiUser.avatar,
      providerId: strapiUser.providerId
    };

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(404).json({ error: 'User not found' });
  }
});
// Logout
router.post('/logout', authMiddleware, async (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;