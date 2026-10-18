import { supabase } from '../supabaseClient.ts';

export interface LostReport {
  id: string;
  user_id: string;
  title: string;
  category: string;
  description: string;
  last_seen_location: string;
  date_lost: string;
  image_url?: string;
  unique_identifiers?: string;
  status: 'open' | 'matched' | 'resolved' | 'closed';
  matched_item_id?: string | null;
  created_at: string;
  updated_at: string;
}

export const lostReportsService = {
  async getLostReports(userId?: string): Promise<LostReport[]> {
    let query = supabase.from('lost_reports').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching lost reports:', error);
      throw error;
    }
    return data || [];
  },

  async getLostReportById(id: string): Promise<LostReport | null> {
    const { data, error } = await supabase
      .from('lost_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching lost report ${id}:`, error);
      return null;
    }
    return data;
  },

  async createLostReport(report: Partial<LostReport>, userId: string): Promise<LostReport> {
    const newReport = {
      ...report,
      user_id: userId,
      status: 'open',
      matched_item_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('lost_reports').insert(newReport);
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data || newReport;
  },

  async updateLostReportStatus(id: string, status: 'open' | 'matched' | 'resolved' | 'closed', matchedItemId?: string | null): Promise<void> {
    const patch: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (matchedItemId !== undefined) {
      patch.matched_item_id = matchedItemId;
    }
    const { error } = await supabase.from('lost_reports').update(patch).eq('id', id);
    if (error) throw error;
  },

  async deleteLostReport(id: string): Promise<void> {
    const { error } = await supabase.from('lost_reports').delete().eq('id', id);
    if (error) throw error;
  },
};
