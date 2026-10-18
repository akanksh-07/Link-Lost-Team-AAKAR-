import { supabase } from '../supabaseClient.ts';

export interface UserProfile {
  id: string;
  full_name: string;
  college_email: string;
  roll_number: string;
  phone_number?: string;
  role: 'student' | 'staff' | 'admin';
  department?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export const profilesService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn(`Could not find profile for user ${userId}:`, error.message);
      return null;
    }
    return data;
  },

  async updateProfile(userId: string, patch: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  },

  async getAllProfiles(): Promise<UserProfile[]> {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error('Error fetching all profiles:', error);
      return [];
    }
    return data || [];
  },
};
