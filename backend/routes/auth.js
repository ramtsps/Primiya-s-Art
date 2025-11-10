const express = require('express');
const passport = require('passport');
const strapiService = require('../services/strapi');
const { generateToken, authMiddleware } = require('../middleware/auth');
const router = express.Router();
// In routes/auth.js - update the register route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log('📝 Registering user:', { name, email });

    // Register user in Strapi
    const strapiResponse = await strapiService.register({
      name,
      email,
      password
    });

    console.log('✅ Strapi registration response:', strapiResponse);

    // Generate our application token
    const token = generateToken(strapiResponse.user.id);

    // Format user data consistently with OAuth users
    const user = {
      id: strapiResponse.user.id,
      strapiId: strapiResponse.user.id,
      name: strapiResponse.user.name || strapiResponse.user.username || name,
      email: strapiResponse.user.email,
      avatar: strapiResponse.user.avatar || null,
      provider: strapiResponse.user.provider_name || 'email',
      providerId: strapiResponse.user.providerId || this.generateEmailProviderId(email)
    };

    console.log('👤 Final user object for registration:', user);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Regular email/password login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    // Authenticate with Strapi
    const strapiResponse = await strapiService.authenticate(email, password);

    console.log('✅ Strapi login response:', strapiResponse);

    // Generate our application token
    const token = generateToken(strapiResponse.user.id);

    // Format user data consistently with OAuth users
    const user = {
      id: strapiResponse.user.id,
      strapiId: strapiResponse.user.id,
      name: strapiResponse.user.name || strapiResponse.user.username,
      email: strapiResponse.user.email,
      avatar: strapiResponse.user.avatar || null,
      provider: strapiResponse.user.provider_name || strapiResponse.user.provider || 'email',
      providerId: strapiResponse.user.providerId
    };

    console.log('👤 Final user object for login:', user);

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error('❌ Login error:', error);
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
      console.log('✅ Facebook OAuth successful, user:', req.user);
      const token = generateToken(req.user.id);
      
      // Redirect to frontend with token
      const redirectUrl = `${process.env.CLIENT_URL}/auth/success?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`;
      console.log('🔄 Redirecting to:', redirectUrl);
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ Facebook OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }
  }
);

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Getting user data for ID:', req.user.userId);
    
    // Get user data from Strapi
    const strapiUser = await strapiService.getUserById(req.user.userId);
    
    console.log('📋 Raw Strapi user data:', strapiUser);
    
    // Format user data consistently
    const user = {
      id: strapiUser.id,
      strapiId: strapiUser.id,
      name: strapiUser.name || strapiUser.username,
      email: strapiUser.email,
      avatar: strapiUser.avatar || null,
      provider: strapiUser.provider_name || strapiUser.provider || 'email',
      providerId: strapiUser.providerId
    };

    console.log('👤 Final user object for /me:', user);

    res.json({ user });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(404).json({ error: 'User not found' });
  }
});

// Logout
router.post('/logout', authMiddleware, async (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;