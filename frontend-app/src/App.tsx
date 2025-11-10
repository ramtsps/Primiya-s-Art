import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from './components/ui/sonner';
import { CartProvider } from './components/CartContext';
import { AuthProvider } from './components/AuthContext';
import { Navigation } from './components/Navigation';
import { CartDrawer } from './components/CartDrawer';
import { Hero } from './components/Hero';
import { FeaturedPrograms } from './components/FeaturedPrograms';
import { Testimonials } from './components/Testimonials';
import { AboutPage } from './components/AboutPage';
import { ProductsPage } from './components/ProductsPage';
import { LocationsPage } from './components/LocationsPage';
import { ProgramDetailPage } from './components/ProgramDetailPage';
import { EnrollmentForm } from './components/EnrollmentForm';
import { CheckoutPage } from './components/CheckoutPage';
import { ContactPage } from './components/ContactPage';
import { LoginPage } from './components/LoginPage';
import { Footer } from './components/Footer';
import { useState } from 'react';
import { ProfilePage } from './components/ProfilePage';
import { CheckoutResultPage } from './components/CheckoutResultPage';
import { AuthSuccess } from './components/AuthSuccess';

// Main App Component with Router
function AppContent() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleCartClick = () => setIsCartOpen(true);
  const handleCartClose = () => setIsCartOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation 
        onCartClick={handleCartClick}
      />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <FeaturedPrograms />
              <Testimonials />
            </>
          } />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/program/:programId" element={<ProgramDetailPage />} />
          <Route path="/enroll" element={<EnrollmentForm />} />
          <Route path="/enroll/:programId" element={<EnrollmentForm />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/profile" element={<ProfilePage/>} />
<Route path="/checkout/result" element={<CheckoutResultPage />} />

<Route path="/auth/success/" element={<AuthSuccess />} />
          {/* Fallback route */}
          <Route path="*" element={
            <>
              <Hero />
              <FeaturedPrograms />
              <Testimonials />
            </>
          } />
        </Routes>
      </main>
      <Footer />
      <CartDrawer 
        open={isCartOpen}
        onClose={handleCartClose}
        onCheckout={() => navigate('/checkout')}
      />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}