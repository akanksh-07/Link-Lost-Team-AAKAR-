import React, { useState, useRef } from 'react';
import { Upload, X, Sparkles, Camera } from 'lucide-react';
import { Spinner } from './Spinner.tsx';
import { storageService } from '../services/storage.ts';

export interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  bucket?: 'item-photos' | 'claim-proofs';
  userId?: string;
  label?: string;
  helperText?: string;
}

const PRESET_PHOTOS = [
  { label: 'Laptop', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
  { label: 'Keys', url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80' },
  { label: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Backpack', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80' },
  { label: 'Bottle', url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80' },
];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  bucket = 'item-photos',
  userId,
  label = 'Item Photograph (Polaroid Proof)',
  helperText = 'Snap or drop a clear photo of the item for ticket verification',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file must be under 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const url = await storageService.uploadImage(file, bucket, userId);
      onChange(url);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err?.message || 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => {
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258]">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-[#D94825] hover:text-[#A93315] font-bold flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Detach Photo
          </button>
        )}
      </div>

      {value ? (
        /* Polaroid Frame with Scotch Tape */
        <div className="relative max-w-sm mx-auto my-2">
          <div className="polaroid-tape" />
          <div className="polaroid-frame rounded-sm transform rotate-1 hover:rotate-0 transition-transform duration-200">
            <div className="aspect-4/3 w-full bg-[#1E1B18] overflow-hidden rounded-xs relative group">
              <img
                src={value}
                alt="Uploaded polaroid proof"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#FCF8F2] text-[#1E1B18] text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-white"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="bg-[#D94825] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-[#A93315]"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="pt-2 text-center">
              <span className="font-mono text-[11px] text-[#8C7E70] uppercase tracking-wider">
                Evidence Tag #PHOTO-LOG
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Dropzone styled like an empty photographic print slot */
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-150 ${
            dragActive
              ? 'border-[#0E6251] bg-[#E7F3F0]'
              : 'border-[#DECBB6] hover:border-[#8C6D4F] bg-[#FCF8F2]/70 hover:bg-[#FCF8F2]'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Spinner size="lg" />
              <p className="mt-3 text-sm text-[#1E1B18] font-bold font-mono">
                Attaching photo to ticket...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-[#EFE4D3] text-[#8C6D4F] flex items-center justify-center mb-3 border border-[#DECBB6]">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-sm font-display font-bold text-[#1E1B18]">
                Drop photo here or click to browse
              </p>
              <p className="text-xs text-[#8C7E70] mt-1 font-mono">{helperText}</p>
            </div>
          )}
        </div>
      )}

      {/* Preset Photopicker */}
      {!value && !isUploading && (
        <div className="mt-3 pt-2.5 border-t border-dashed border-[#DECBB6] flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono font-bold text-[#8C7E70] flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-[#D94825]" /> Quick Ticket Samples:
          </span>
          {PRESET_PHOTOS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.url)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-[#EFE4D3] hover:bg-[#DECBB6] text-[#1E1B18] font-mono font-semibold transition-colors border border-[#DECBB6]"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {error && <p className="mt-2 text-xs text-[#D94825] font-mono font-bold">{error}</p>}
    </div>
  );
};
