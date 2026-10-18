import { supabase } from '../supabaseClient.ts';
import { ItemStatus } from '../lib/constants.ts';

export interface FoundItem {
  id: string;
  title: string;
  category: string;
  description: string;
  found_location: string;
  found_date: string;
  found_time?: string;
  storage_location?: string;
  image_url?: string;
  reported_by?: string;
  status: ItemStatus;
  is_verified: boolean;
  verified_by?: string | null;
  tags?: string[];
  secret_identifying_details?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemStatusHistoryRecord {
  id: string;
  item_id: string;
  changed_by?: string;
  changer_name: string;
  changer_role: string;
  old_status?: string | null;
  new_status: string;
  reason: string;
  created_at: string;
}

export interface FoundItemFilters {
  search?: string;
  category?: string;
  location?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  reportedBy?: string;
}

export const foundItemsService = {
  /**
   * Fetch all found items matching search and filter criteria
   */
  async getFoundItems(filters: FoundItemFilters = {}): Promise<FoundItem[]> {
    let query = supabase.from('found_items').select('*');

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.reportedBy) {
      query = query.eq('reported_by', filters.reportedBy);
    }

    query = query.order('found_date', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching found items:', error);
      throw error;
    }

    let items: FoundItem[] = data || [];

    // Client-side text search & location filter for flexible substring matches
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.found_location.toLowerCase().includes(q) ||
          (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (filters.location && filters.location !== 'all') {
      const locQ = filters.location.toLowerCase();
      items = items.filter((item) => item.found_location.toLowerCase().includes(locQ));
    }

    return items;
  },

  /**
   * Get single found item by ID
   */
  async getFoundItemById(id: string): Promise<FoundItem | null> {
    const { data, error } = await supabase
      .from('found_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching item ${id}:`, error);
      return null;
    }
    return data;
  },

  /**
   * Create a new found item record and automatically generate the first audit entry
   */
  async createFoundItem(item: Partial<FoundItem>, userProfile: any): Promise<FoundItem> {
    const newItem = {
      ...item,
      status: 'unclaimed',
      is_verified: userProfile.role === 'admin',
      verified_by: userProfile.role === 'admin' ? userProfile.id : null,
      reported_by: userProfile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('found_items').insert(newItem);
    if (error) throw error;

    const saved = Array.isArray(data) ? data[0] : data || newItem;

    // Record initial status history
    await supabase.from('item_status_history').insert({
      item_id: saved.id,
      changed_by: userProfile.id,
      changer_name: userProfile.full_name,
      changer_role: userProfile.role,
      old_status: null,
      new_status: 'unclaimed',
      reason: `Reported found at ${saved.found_location}`,
      created_at: new Date().toISOString(),
    });

    return saved;
  },

  /**
   * Transition item status (e.g. unclaimed -> in_review -> claimed -> returned)
   * Enforces mandatory audit trail logging!
   */
  async updateItemStatus(
    itemId: string,
    newStatus: ItemStatus,
    reason: string,
    userProfile: any,
    extraUpdates: Partial<FoundItem> = {}
  ): Promise<void> {
    const current = await this.getFoundItemById(itemId);
    const oldStatus = current?.status || null;

    const patch: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...extraUpdates,
    };

    const { error } = await supabase.from('found_items').update(patch).eq('id', itemId);
    if (error) throw error;

    // Append to immutable audit log
    await supabase.from('item_status_history').insert({
      item_id: itemId,
      changed_by: userProfile.id,
      changer_name: userProfile.full_name,
      changer_role: userProfile.role,
      old_status: oldStatus,
      new_status: newStatus,
      reason: reason.trim() || `Status updated to ${newStatus}`,
      created_at: new Date().toISOString(),
    });
  },

  /**
   * Fetch complete immutable audit log for a given item
   */
  async getItemStatusHistory(itemId: string): Promise<ItemStatusHistoryRecord[]> {
    const { data, error } = await supabase
      .from('item_status_history')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit history:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Fetch all recent status changes across the entire campus (for Admin Command Center)
   */
  async getRecentAuditLogs(limitCount = 25): Promise<ItemStatusHistoryRecord[]> {
    const { data, error } = await supabase
      .from('item_status_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) {
      console.error('Error fetching global audit logs:', error);
      return [];
    }
    return data || [];
  },
};
