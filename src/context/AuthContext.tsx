import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, mockDb, isLiveSupabase } from '../supabaseClient.ts';
import { UserProfile, profilesService } from '../services/profiles.ts';

interface AuthContextType {
  user: any | null;
  session: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password?: string) => Promise<{ error: any | null }>;
  register: (data: {
    fullName: string;
    collegeEmail: string;
    rollNumber: string;
    phoneNumber?: string;
    password?: string;
    role?: 'student' | 'admin';
  }) => Promise<{ error: any | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchDemoRole: (role: 'student' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, userMeta?: any) => {
    try {
      const existing = await profilesService.getProfile(userId);
      if (existing) {
        setProfile(existing);
        return;
      }
      // If profile record isn't in DB yet, construct from user metadata
      if (userMeta) {
        const fallbackProfile: UserProfile = {
          id: userId,
          full_name: userMeta.full_name || 'Campus Student',
          college_email: userMeta.college_email || userMeta.email || 'student@campus.edu',
          roll_number: userMeta.roll_number || '2024CS104',
          phone_number: userMeta.phone_number || '',
          role: userMeta.role || 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id, user);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          await fetchProfile(data.session.user.id, data.session.user);
        } else {
          // If in simulated demo mode, auto-login as Student Alex by default for instant interactivity
          if (!isLiveSupabase) {
            const alex = mockDb.getTable('profiles').find((p) => p.role === 'student');
            if (alex) {
              setUser(alex);
              setSession({ user: alex });
              setProfile(alex);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: string, currentSession: any) => {
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id, currentSession.user);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const login = async (email: string, password = 'Password123!') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id, data.user);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    fullName: string;
    collegeEmail: string;
    rollNumber: string;
    phoneNumber?: string;
    password?: string;
    role?: 'student' | 'admin';
  }) => {
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.collegeEmail.trim().toLowerCase(),
        password: data.password || 'Password123!',
        options: {
          data: {
            full_name: data.fullName.trim(),
            roll_number: data.rollNumber.trim(),
            phone_number: data.phoneNumber?.trim() || '',
            role: data.role || 'student',
          },
        },
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      if (authData?.user) {
        setUser(authData.user);
        setSession(authData.session);
        await fetchProfile(authData.user.id, {
          ...authData.user,
          full_name: data.fullName,
          roll_number: data.rollNumber,
          phone_number: data.phoneNumber,
          role: data.role || 'student',
        });
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const switchDemoRole = async (targetRole: 'student' | 'admin') => {
    setLoading(true);
    try {
      const profiles = mockDb.getTable('profiles');
      const target = profiles.find((p) => p.role === targetRole) || profiles[0];
      if (target) {
        setUser(target);
        setSession({ user: target });
        setProfile(target);
      }
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAdmin,
        login,
        register,
        logout,
        refreshProfile,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
