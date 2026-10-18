import { supabase } from '../supabaseClient.ts';
import { ClaimStatus } from '../lib/constants.ts';
import { foundItemsService } from './foundItems.ts';

export interface Claim {
  id: string;
  item_id: string;
  claimant_id: string;
  proof_description: string;
  proof_image_url?: string;
  contact_phone: string;
  status: ClaimStatus;
  admin_notes?: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  pickup_scheduled_at?: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  item_title?: string;
  item_category?: string;
  item_image_url?: string;
  claimant_name?: string;
  claimant_email?: string;
  claimant_roll?: string;
}

export const claimsService = {
  /**
   * Submit an ownership claim for a found item
   */
  async submitClaim(
    data: {
      itemId: string;
      proofDescription: string;
      proofImageUrl?: string;
      contactPhone: string;
    },
    userProfile: any
  ): Promise<Claim> {
    const newClaim = {
      item_id: data.itemId,
      claimant_id: userProfile.id,
      proof_description: data.proofDescription,
      proof_image_url: data.proofImageUrl || null,
      contact_phone: data.contactPhone,
      status: 'pending',
      admin_notes: null,
      reviewed_by: null,
      reviewed_at: null,
      pickup_scheduled_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error } = await supabase.from('claims').insert(newClaim);
    if (error) throw error;

    const savedClaim = Array.isArray(inserted) ? inserted[0] : inserted || newClaim;

    // Transition item status to in_review and record in audit log
    await foundItemsService.updateItemStatus(
      data.itemId,
      'in_review',
      `Claim request submitted by student ${userProfile.full_name} (${userProfile.roll_number})`,
      userProfile
    );

    return savedClaim;
  },

  /**
   * Fetch claims with optional claimant or item filtering
   */
  async getClaims(options: { claimantId?: string; itemId?: string } = {}): Promise<Claim[]> {
    let query = supabase.from('claims').select('*');

    if (options.claimantId) {
      query = query.eq('claimant_id', options.claimantId);
    }
    if (options.itemId) {
      query = query.eq('item_id', options.itemId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching claims:', error);
      throw error;
    }

    const claims: Claim[] = data || [];

    // Augment with item and claimant profile details
    const items = await foundItemsService.getFoundItems();
    const { data: profiles } = await supabase.from('profiles').select('*');
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const itemMap = new Map(items.map((it) => [it.id, it]));

    return claims.map((c) => {
      const it = itemMap.get(c.item_id);
      const pr: any = profileMap.get(c.claimant_id);
      return {
        ...c,
        item_title: it?.title || 'Unknown Item',
        item_category: it?.category || 'General',
        item_image_url: it?.image_url,
        claimant_name: pr?.full_name || 'Campus Student',
        claimant_email: pr?.college_email || 'student@campus.edu',
        claimant_roll: pr?.roll_number || 'N/A',
      };
    });
  },

  /**
   * Review claim (Approve or Reject)
   */
  async reviewClaim(
    claimId: string,
    status: 'approved' | 'rejected',
    adminNotes: string,
    reviewerProfile: any,
    pickupDate?: string
  ): Promise<void> {
    const claims = await this.getClaims();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) throw new Error('Claim not found');

    const patch: any = {
      status,
      admin_notes: adminNotes,
      reviewed_by: reviewerProfile.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (status === 'approved' && pickupDate) {
      patch.pickup_scheduled_at = pickupDate;
    }

    const { error } = await supabase.from('claims').update(patch).eq('id', claimId);
    if (error) throw error;

    // Synchronize item status
    if (status === 'approved') {
      await foundItemsService.updateItemStatus(
        claim.item_id,
        'claimed',
        `Claim approved by ${reviewerProfile.full_name}: ${adminNotes || 'Ownership proof accepted'}`,
        reviewerProfile
      );
    } else if (status === 'rejected') {
      // Check if there are other pending claims on this item
      const otherClaims = claims.filter((c) => c.item_id === claim.item_id && c.id !== claimId && c.status === 'pending');
      const nextStatus = otherClaims.length > 0 ? 'in_review' : 'unclaimed';
      await foundItemsService.updateItemStatus(
        claim.item_id,
        nextStatus,
        `Claim rejected by ${reviewerProfile.full_name}: ${adminNotes || 'Insufficient proof'}`,
        reviewerProfile
      );
    }
  },
};
