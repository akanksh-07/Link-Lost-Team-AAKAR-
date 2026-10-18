import { supabase, isLiveSupabase } from '../supabaseClient.ts';

export const storageService = {
  /**
   * Upload an item photo or claim verification attachment
   * Returns a publicly accessible URL or base64 data string
   */
  async uploadImage(
    file: File,
    bucket: 'item-photos' | 'claim-proofs' = 'item-photos',
    userId?: string
  ): Promise<string> {
    if (!file) throw new Error('No file provided for upload');

    // If client is using live Supabase
    if (isLiveSupabase) {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${userId || 'guest'}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw error;
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return publicUrlData.publicUrl;
    }

    // Client-side fallback: Convert to Data URL for instant rendering & offline storage
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (err) => {
        reject(err);
      };
      reader.readAsDataURL(file);
    });
  },
};
