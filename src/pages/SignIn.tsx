import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, Building2, School, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type UserType = 'university' | 'brand';

const SignIn = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType>('university');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Add this useEffect to check for pending navigation after page reload
  useEffect(() => {
    const pendingNavigation = localStorage.getItem('pendingNavigation');
    if (pendingNavigation) {
      // Remove the pending navigation flag
      localStorage.removeItem('pendingNavigation');
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate(pendingNavigation);
      }, 1500);
    }
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Special case for admin login
      if (username === 'admin@illuminatii.com') {
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
          email: username,
          password
        });

        if (signInError) throw signInError;

        if (user) {
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('role')
            .eq('id', user.id)
            .single();

          if (adminData) {
            navigate('/admin');
            return;
          }
        }
        throw new Error('Invalid admin credentials');
      }

      // Check credentials directly in predefined_credentials table
      const { data: credData, error: credError } = await supabase
        .from('predefined_credentials')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .eq('user_type', userType)
        .single();

      if (credError) {
        console.log('Error checking credentials:', credError);
        throw new Error('Error verifying credentials');
      }

      if (!credData) {
        console.log('Invalid credentials for:', { username, userType });
        throw new Error('Invalid credentials');
      }

      // Store user info in localStorage
      localStorage.setItem('userType', userType);
      localStorage.setItem('username', username);
      localStorage.setItem('isAuthenticated', 'true');

      const {data: userId} = await supabase
        .from('predefined_credentials')
        .select('*')
        .eq('username', username)
        .single();

        localStorage.setItem('userid', userId.id);
      
      // Store the destination path for after reload
      const destinationPath = userType === 'university' ? '/sponsorships' : '/submit-sponsorship';
      localStorage.setItem('pendingNavigation', destinationPath);

      // Update last used timestamp
      await supabase
        .from('predefined_credentials')
        .update({ last_used: new Date().toISOString() })
        .eq('username', username);

      // Show success message and reload the page
      setSuccess(true);
      
      // Short timeout to ensure the success state is visible before reload
      setTimeout(() => {
        window.location.reload();
      }, 300);
      
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Invalid credentials. Please check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-black">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00FF0015_1px,transparent_1px)] bg-[size:100px] bg-[position:center] animated-grid after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(to_bottom,#00FF0015_1px,transparent_1px)] after:bg-[size:100px] after:bg-[position:center]">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        </div>
      </div>

      <div className="relative max-w-md mx-auto px-4 py-12">
        <Link 
          to="/" 
          className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-neon-green/20"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In</h2>
          {success ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-8">
              <p className="text-green-500 text-center font-medium">
                Login successful! Redirecting...
              </p>
            </div>
          ) : (
            <p className="text-gray-400 text-center mb-8">
              Welcome back! Sign in to manage your sponsorship opportunities.
            </p>
          )}

          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setUserType('university')}
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                userType === 'university'
                  ? 'bg-neon-green text-black'
                  : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              <School size={20} />
              University
            </button>
            <button
              onClick={() => setUserType('brand')}
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                userType === 'brand'
                  ? 'bg-neon-green text-black'
                  : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              <Building2 size={20} />
              Brand
            </button>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-neon-green text-black rounded-lg font-semibold hover:bg-[#00CC00] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default SignIn;