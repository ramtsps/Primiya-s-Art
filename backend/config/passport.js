const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const strapiService = require('../services/strapi');

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.API_URL}/api/auth/google/callback`,
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔐 Google OAuth profile received:');
    console.log('Profile ID:', profile.id);
    console.log('Email:', profile.emails[0].value);
    console.log('Display Name:', profile.displayName);
    
    // Find or create user in Strapi
    console.log('🔄 Finding or creating user in Strapi...');
    const strapiUser = await strapiService.findOrCreateOAuthUser(profile, 'google');
    
    console.log('✅ Strapi user response:', strapiUser);
    
    // Format user data for our application - with proper fallbacks
    const user = {
      id: strapiUser.id,
      strapiId: strapiUser.id,
      name: strapiUser.name || strapiUser.username || profile.displayName,
      email: strapiUser.email,
      avatar: strapiUser.avatar || profile.photos?.[0]?.value,
      provider: strapiUser.provider_name || 'google',
      providerId: strapiUser.providerId || profile.id
    };

    console.log('👤 Final user object:', user);
    return done(null, user);
  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    return done(error, null);
  }
}));

// Facebook Strategy - Updated with better profile handling
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: `${process.env.API_URL}/api/auth/facebook/callback`,
  profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
  enableProof: true
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔐 Facebook OAuth profile received:');
    console.log('Profile ID:', profile.id);
    console.log('Email:', profile.emails?.[0]?.value);
    console.log('Display Name:', profile.displayName);
    console.log('Name:', profile.name);
    
    // Find or create user in Strapi
    console.log('🔄 Finding or creating user in Strapi...');
    const strapiUser = await strapiService.findOrCreateOAuthUser(profile, 'facebook');
    
    console.log('✅ Strapi user response:', strapiUser);
    
    // Format user data for our application with proper fallbacks
    const user = {
      id: strapiUser.id,
      strapiId: strapiUser.id,
      name: strapiUser.name || strapiUser.username || profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
      email: strapiUser.email,
      avatar: strapiUser.avatar || profile.photos?.[0]?.value,
      provider: strapiUser.provider_name || 'facebook',
      providerId: strapiUser.providerId || profile.id
    };

    console.log('👤 Final user object:', user);
    return done(null, user);
  } catch (error) {
    console.error('❌ Facebook OAuth error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    done(null, { id });
  } catch (error) {
    done(error, null);
  }
});