import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  userType: string | null;
  isAdmin: boolean;
  loading: boolean;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userType: null,
  isAdmin: false,
  loading: true,
  isConfigured: false
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<string | null>(localStorage.getItem('userType'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  // Function to check local auth (predefined credentials)
  const checkLocalAuth = () => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const storedUserType = localStorage.getItem('userType');
    const storedUsername = localStorage.getItem('username');

    if (isAuthenticated && storedUserType && storedUsername) {
      setUserType(storedUserType);
      // Create a pseudo-user object for compatibility
      setUser({ id: storedUsername } as User);
      setIsAdmin(false);
      return true;
    }
    return false;
  };

  const fetchUserData = async (userId: string | null) => {
    if (!userId) {
      setUser(null);
      setUserType(null);
      setIsAdmin(false);
      return;
    }

    try {
      // First check if user is an admin
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (adminData) {
        setIsAdmin(true);
        setUserType('admin');
        return;
      }

      // If not admin, get regular user type from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        setUserType(profile.user_type);
        setIsAdmin(false);
      } else {
        setUserType(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserType(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

      const handleAuthChange = async (session: { user: User } | null) => {
        if (session?.user) {
          setUser(session.user);
          await fetchUserData(session.user.id);
        } else {
          await fetchUserData(null);
        }
        setLoading(false);
      };
  
      // Only check local authentication for regular users
      if (checkLocalAuth()) {
        setLoading(false);
        return;
      }
  
      // Only use Supabase auth for admin users
      if (localStorage.getItem('username') === 'admin@illuminatii.com') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          handleAuthChange(session);
        });
  
        // Listen for changes on auth state only for admin
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          handleAuthChange(session);
        });
  
        return () => subscription.unsubscribe();
      } else {
        // For non-admin users, just set loading to false
        setLoading(false);
        fetchUserData(null); // Remove await since we don't need to wait for this promise
      }
  }, [configured]);

  return (
    <AuthContext.Provider value={{ user, userType, isAdmin, loading, isConfigured: configured }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

