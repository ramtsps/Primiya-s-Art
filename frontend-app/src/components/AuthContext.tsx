import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  strapiId: string;
  name: string;
  email: string;
  avatar?: string;
  provider?: 'email' | 'google' | 'facebook';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  loginWithFacebook: () => void;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'https://primiya-s-art.vercel.app/api';

// Enhanced fetch function with better error handling
const apiFetch = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Add this for CORS with credentials
  });

  if (!response.ok) {
    // Handle 426 Upgrade Required specifically
    if (response.status === 426) {
      throw new Error('Protocol error. Please try again.');
    }
    
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    } catch {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  return response.json();
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getStoredToken = () => localStorage.getItem('authToken');
  const setStoredToken = (token: string) => localStorage.setItem('authToken', token);
  const removeStoredToken = () => localStorage.removeItem('authToken');

  const login = async (email: string, password: string) => {
    const data = await apiFetch(`${API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setStoredToken(data.token);
    setUser(data.user);
  };

  const loginWithGoogle = () => {
    // Clear any existing tokens before starting new OAuth flow
    removeStoredToken();
    window.location.href = `${API_URL}/auth/google`;
  };

  const loginWithFacebook = () => {
    // Clear any existing tokens before starting new OAuth flow
    removeStoredToken();
    window.location.href = `${API_URL}/auth/facebook`;
  };

  const signup = async (name: string, email: string, password: string) => {
    const data = await apiFetch(`${API_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    setStoredToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    removeStoredToken();
    setUser(null);
    // Optional: Redirect to home page after logout
    window.location.href = '/';
  };

  const fetchUserData = async (token: string) => {
    try {
      const data = await apiFetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Error fetching user data:', error);
      removeStoredToken();
      return false;
    }
  };

  const checkAuth = async () => {
    const token = getStoredToken();
    if (token) {
      await fetchUserData(token);
    }
    setLoading(false);
  };

  const handleOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    
    console.log('OAuth Callback - Token:', token);
    console.log('OAuth Callback - User param:', userParam);

    if (token && userParam) {
      try {
        setStoredToken(token);
        
        // Parse the user data from URL parameter
        const userData = JSON.parse(decodeURIComponent(userParam));
        setUser(userData);
        
        // Clean URL - remove OAuth parameters without causing redirect issues
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Redirect to home page or dashboard after successful auth
        window.location.href = '/';
        
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
        // Fallback: try to fetch user data from API
        const success = await fetchUserData(token);
        if (success) {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          window.location.href = '/';
        }
      }
    } else {
      console.error('Missing token or user data in OAuth callback');
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
 
     // Check if we're on the auth success page
      const isAuthSuccessPage = window.location.pathname.includes('/auth/success');
      
      if (isAuthSuccessPage) {
        await handleOAuthCallback();
      } else {
        await checkAuth();
      }
    };
    
    initializeAuth();
  }, []);
  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithGoogle,
        loginWithFacebook,
        signup,
        logout,
        isAuthenticated: !!user,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}