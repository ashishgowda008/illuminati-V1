import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Shield } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const AdminSignIn = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (signInError) throw signInError;

      if (!user) {
        throw new Error('Authentication failed');
      }

      // Check if user exists in admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        throw new Error('Unauthorized access. Admin privileges required.');
      }

      // Set localStorage values after successful authentication
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userType', 'admin');
      localStorage.setItem('username', username);

      try {
        // Make sure Supabase session is updated before redirect
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Session established:", !!session);
        
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userType', 'admin');
        localStorage.setItem('username', username);
        
        // Store the destination path for after reload
        localStorage.setItem('pendingNavigation', '/admin');

        // Show success message and reload the page
        setSuccess(true);
        
        // Short timeout to ensure the success state is visible before reload
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } catch (err) {
        console.error("Session error:", err);
      }

    } catch (err: any) {
      setError(err?.message || 'An error occurred during sign in');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userType');
      localStorage.removeItem('username');
      await supabase.auth.signOut();
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-neon-green/20"
        >
          <div className="flex justify-center mb-6">
            <Shield className="w-12 h-12 text-neon-green" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Admin Sign In</h2>
          {success ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-8">
              <p className="text-green-500 text-center font-medium">
                Login successful! Redirecting...
              </p>
            </div>
          ) : (
            <p className="text-gray-400 text-center mb-8">
              Access the admin dashboard to manage sponsorships and users.
            </p>
          )}

          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-neon-green/20 rounded-lg text-white focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
                  placeholder="Enter admin email"
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

export default AdminSignIn;