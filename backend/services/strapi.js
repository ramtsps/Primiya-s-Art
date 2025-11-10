const axios = require('axios');

class StrapiService {
  constructor() {
    this.baseURL = process.env.STRAPI_URL || 'http://localhost:1337';
    this.apiToken = process.env.STRAPI_API_TOKEN;
    
    // Create axios instance with default headers
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async testConnection() {
    try {
      console.log('Testing Strapi connection...');
      
      // Test users endpoint
      const usersResponse = await this.api.get('/api/users');
      console.log('✅ Users endpoint accessible');
      
      return true;
    } catch (error) {
      console.error('❌ Strapi connection test failed:', error.response?.data || error.message);
      return false;
    }
  }

async authenticate(email, password) {
  try {
    const response = await this.api.post('/api/auth/local', {
      identifier: email,
      password: password
    });
    
    // Ensure the response has provider information
    if (response.data.user) {
      // If provider info is missing, add default email provider info
      if (!response.data.user.provider_name) {
        response.data.user.provider_name = 'email';
      }
      if (!response.data.user.providerId) {
        response.data.user.providerId = this.generateEmailProviderId(email);
      }
    }
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'Authentication failed');
  }
}
// In services/strapi.js - update the register method
async register(userData) {
  try {
    // Only send basic fields that Strapi accepts for registration
    const registrationData = {
      username: userData.name || userData.email.split('@')[0],
      email: userData.email,
      password: userData.password
    };

    console.log('📝 Registering user with basic data:', registrationData);
    
    const response = await this.api.post('/api/auth/local/register', registrationData);
    console.log('✅ User registered with basic fields:', response.data);
    
    // Now update the user with additional fields
    if (response.data.user) {
      console.log('🔄 Updating user with additional fields...');
      const updatedUser = await this.updateUserAfterRegistration(response.data.user.id, userData);
      return updatedUser || response.data;
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Strapi registration error:', error.response?.data);
    throw new Error(error.response?.data?.error?.message || 'Registration failed');
  }
}

// Add this method to update user after registration
async updateUserAfterRegistration(userId, userData) {
  try {
    const updateData = {
      name: userData.name,
      provider_name: 'email',
      providerId: this.generateEmailProviderId(userData.email)
    };

    console.log('📝 Updating user with additional data:', updateData);
    
    const response = await this.api.put(`/api/users/${userId}`, updateData);
    console.log('✅ User updated successfully:', response.data);
    
    // Return the complete user data
    return {
      ...response.data,
      user: response.data // Strapi returns the user object directly on update
    };
  } catch (updateError) {
    console.error('❌ Failed to update user with additional fields:', updateError.response?.data || updateError.message);
    
    // Even if update fails, return the original registration data
    // The user was created successfully, just without the extra fields
    console.log('⚠️ User created but additional fields not set');
    return null;
  }
}

// Add this helper method to generate providerId for email users
generateEmailProviderId(email) {
  return `email_${email}_${Date.now()}`;
}
// Add this helper method to generate providerId for email users

  async findOrCreateOAuthUser(profile, provider) {
    try {
      console.log(`Finding or creating OAuth user for ${provider}:`, profile.emails[0].value);

      // Try to find user by provider ID first
      let existingUser = null;
      try {
        const response = await this.api.get(`/api/users?filters[providerId][$eq]=${profile.id}`);
        console.log('Users search by providerId result:', response.data);
        
        if (response.data && response.data.length > 0) {
          existingUser = response.data[0];
        } else if (response.data.data && response.data.data.length > 0) {
          existingUser = response.data.data[0];
        }
      } catch (error) {
        console.log('Users search by providerId failed:', error.response?.data || error.message);
      }

      if (existingUser) {
        console.log('Found user by provider ID:', existingUser);
        return existingUser;
      }

      // Try to find by email
      try {
        const response = await this.api.get(`/api/users?filters[email][$eq]=${profile.emails[0].value}`);
        console.log('Users search by email result:', response.data);
        
        if (response.data && response.data.length > 0) {
          existingUser = response.data[0];
        } else if (response.data.data && response.data.data.length > 0) {
          existingUser = response.data.data[0];
        }
      } catch (error) {
        console.log('Users search by email failed:', error.response?.data || error.message);
      }

      if (existingUser) {
        console.log('Found user by email, updating with provider info:', existingUser);
        // Update existing user with provider information
        const updatedUser = await this.updateUserWithProviderInfo(existingUser.id, profile, provider);
        return updatedUser || existingUser;
      }

      // Create new user with OAuth data using the improved method
      console.log('Creating new user in Strapi with OAuth data...');
      const newUser = await this.registerWithOAuthData(profile, provider);

      console.log('New user created:', newUser);
      return newUser.user || newUser;

    } catch (error) {
      console.error('OAuth user creation failed:', error);
      throw new Error(`OAuth user creation failed: ${error.message}`);
    }
  }

  async registerWithOAuthData(profile, provider) {
    // First, create user with only basic fields that Strapi accepts
    try {
      const basicUserData = {
        username: this.generateUsername(profile),
        email: profile.emails[0].value,
        password: this.generateRandomPassword()
      };

      console.log('Creating user with basic data first:', basicUserData);
      
      const response = await this.api.post('/api/auth/local/register', basicUserData);
      console.log('User created with basic fields:', response.data);
      
      // Then update with OAuth data
      if (response.data.user) {
        const updatedUser = await this.updateUserWithProviderInfo(response.data.user.id, profile, provider);
        return updatedUser || response.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('OAuth registration failed completely:', error.response?.data);
      throw new Error(error.response?.data?.error?.message || 'OAuth registration failed');
    }
  }

  async updateUserWithProviderInfo(userId, profile, provider) {
    try {
      console.log('Updating user with provider info:', userId);
      
      // Prepare update data - use field names exactly as they appear in Strapi
      const updateData = {};
      
      // Add fields only if they have values
      if (profile.photos?.[0]?.value) {
        updateData.avatar = profile.photos[0].value;
      }
      
      if (provider) {
        updateData.provider_name = provider;
      }
      
      if (profile.id) {
        updateData.providerId = profile.id;
      }
      
      const displayName = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim();
      if (displayName) {
        updateData.name = displayName;
      }

      console.log('Update data for user:', updateData);

      if (Object.keys(updateData).length === 0) {
        console.log('No OAuth data to update');
        return null;
      }

      // Use PATCH instead of PUT for partial updates
      const response = await this.api.put(`/api/users/${userId}`, updateData);
      console.log('User updated successfully with OAuth data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to update user with OAuth data:', error.response?.data || error.message);
      
      // Try alternative approach - update fields one by one
      try {
        console.log('Trying alternative update approach...');
        await this.updateUserFieldsIndividually(userId, profile, provider);
        return await this.getUserById(userId);
      } catch (secondError) {
        console.error('Alternative update also failed:', secondError.message);
        return null;
      }
    }
  }

  async updateUserFieldsIndividually(userId, profile, provider) {
    // Try updating fields one by one to isolate which field is causing issues
    const updates = [
      { field: 'providerId', value: profile.id },
      { field: 'provider_name', value: provider },
      { field: 'name', value: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}` },
      { field: 'avatar', value: profile.photos?.[0]?.value }
    ];

    for (const update of updates) {
      if (update.value) {
        try {
          const updateData = { [update.field]: update.value };
          await this.api.put(`/api/users/${userId}`, updateData);
          console.log(`✅ Successfully updated ${update.field}`);
        } catch (error) {
          console.log(`❌ Failed to update ${update.field}:`, error.response?.data?.error?.message || error.message);
        }
      }
    }
  }

  async getUserById(userId) {
    try {
      const response = await this.api.get(`/api/users/${userId}`);
      console.log('User by ID response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user by ID:', error.response?.data || error.message);
      throw new Error('User not found');
    }
  }

  generateRandomPassword() {
    return Math.random().toString(36).slice(-16) + 'A1!';
  }

  generateUsername(profile) {
    const baseUsername = profile.displayName || 
      `${profile.name?.givenName || ''}${profile.name?.familyName || ''}`.trim() || 
      profile.emails[0].value.split('@')[0];
    
    // Clean the username: remove special characters, make lowercase, limit length
    const cleanUsername = baseUsername
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15);
    
    // Add provider ID snippet to ensure uniqueness
    const uniqueSuffix = profile.id ? `_${profile.id.substring(0, 6)}` : `_${Date.now().toString(36)}`;
    
    return `${cleanUsername}${uniqueSuffix}`;
  }
}

module.exports = new StrapiService();