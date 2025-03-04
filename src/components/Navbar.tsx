import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsOpen(false);
  }, [location]);

  // Add this useEffect to check for pending navigation after page reload
  useEffect(() => {
    const signOutRedirect = localStorage.getItem('signOutRedirect');
    if (signOutRedirect) {
      localStorage.removeItem('signOutRedirect');
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      // First clear local storage
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userType');
      localStorage.removeItem('username');
      localStorage.removeItem('userid');
      
      // Set flag for post-reload navigation
      localStorage.setItem('signOutRedirect', 'true');
      
      // Then sign out from supabase (if applicable)
      await supabase.auth.signOut();
      
      // Close mobile menu if open
      setIsOpen(false); 
      
      // Reload the page - navigation will happen after reload via useEffect
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="fixed w-full bg-black/80 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src="/illuminatii-logo.png" 
                alt="Illuminatii Logo" 
                className="h-60 w-auto object-contain" // Increased from h-40 to h-60
              />
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link to="/sponsorships" className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                Sponsorship Listings
              </Link>
              <Link to="/about" className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                About Us
              </Link>
              <Link to="/partner" className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium">
                Partner With Us
              </Link>
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/waitlist"
                  className="bg-[#00FF00] hover:bg-[#00CC00] text-black px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 shadow-[0_0_10px_rgba(0,255,0,0.5)]"
                >
                  Join Waitlist
                </Link>
              )}
            </div>
          </div>
          
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-gray-300 p-2 transition-colors duration-200"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black">
            <Link to="/" className="text-white hover:text-gray-300 block px-3 py-2 rounded-md text-base font-medium">
              Home
            </Link>
            <Link to="/sponsorships" className="text-white hover:text-gray-300 block px-3 py-2 rounded-md text-base font-medium">
              Sponsorship Listings
            </Link>
            <Link to="/about" className="text-white hover:text-gray-300 block px-3 py-2 rounded-md text-base font-medium">
              About Us
            </Link>
            <Link to="/partner" className="text-white hover:text-gray-300 block px-3 py-2 rounded-md text-base font-medium">
              Partner With Us
            </Link>
            {user ? (
              <button
                onClick={handleSignOut}
                className="text-white hover:text-gray-300 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/waitlist"
                className="w-full bg-[#00FF00] hover:bg-[#00CC00] text-black px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 shadow-[0_0_10px_rgba(0,255,0,0.5)] block text-center"
              >
                Join Waitlist
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;