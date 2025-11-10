import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function AuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    
    console.log('AuthSuccess - Processing OAuth callback');
    console.log('Token present:', !!token);
    console.log('User param present:', !!userParam);

    if (token) {
      // Store token immediately
      localStorage.setItem('authToken', token);
      console.log('Token stored successfully');
      
      // Parse user data if available
      if (userParam) {
        try {
          const userData = JSON.parse(decodeURIComponent(userParam));
          console.log('User data from URL:', userData);
        } catch (error) {
          console.error('Error parsing user data from URL:', error);
        }
      }
      
      // Redirect to home after a brief delay to allow context to update
      const timer = setTimeout(() => {
        console.log('Redirecting to home page');
        navigate('/', { replace: true });
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      // If no token, redirect to login
      console.log('No token found, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Successful!</h2>
        <p className="text-gray-600">Redirecting you to the home page...</p>
      </div>
    </div>
  );
}