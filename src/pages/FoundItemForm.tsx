import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, ArrowLeft, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Input } from '../components/Input.tsx';
import { Button } from '../components/Button.tsx';
import { Alert } from '../components/Alert.tsx';
import { ImageUploader } from '../components/ImageUploader.tsx';
import { ITEM_CATEGORIES, CAMPUS_LOCATIONS, STORAGE_LOCATIONS } from '../lib/constants.ts';
import { validateFoundItem } from '../lib/validation.ts';
import { foundItemsService } from '../services/foundItems.ts';

export const FoundItemForm: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: ITEM_CATEGORIES[0].name,
    foundLocation: CAMPUS_LOCATIONS[0].name,
    customLocation: '',
    foundDate: new Date().toISOString().split('T')[0],
    foundTime: '12:00',
    description: '',
    storageLocation: STORAGE_LOCATIONS[0],
    secretDetails: '',
    imageUrl: '',
    tags: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stampedSuccess, setStampedSuccess] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const actualLocation =
      formData.foundLocation === 'custom'
        ? formData.customLocation.trim()
        : formData.foundLocation;

    const validation = validateFoundItem({
      title: formData.title,
      category: formData.category,
      description: formData.description,
      foundLocation: actualLocation,
      foundDate: formData.foundDate,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      const parsedTags = formData.tags
        ? formData.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const created = await foundItemsService.createFoundItem(
        {
          title: formData.title.trim(),
          category: formData.category,
          description: formData.description.trim(),
          found_location: actualLocation,
          found_date: formData.foundDate,
          found_time: formData.foundTime,
          storage_location: formData.storageLocation,
          secret_identifying_details: formData.secretDetails.trim() || undefined,
          image_url: formData.imageUrl || undefined,
          tags: parsedTags,
        },
        profile || user
      );

      // Trigger Signature Stamp Thump Animation
      setStampedSuccess(created.id);
      setTimeout(() => {
        navigate(`/items/${created.id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error reporting found item:', err);
      setServerError(err.message || 'Failed to submit found item ticket. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-6">
      {/* Top Back Link */}
      <div className="mb-6">
        <Link
          to="/items"
          className="font-mono text-xs font-bold text-[#8C6D4F] hover:text-[#1E1B18] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> &larr; Return to Claim Board
        </Link>
      </div>

      {stampedSuccess ? (
        <div className="bg-[#FCF8F2] rounded-3xl border-3 border-[#0E6251] p-10 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 bg-[#E7F3F0] rounded-2xl flex items-center justify-center mx-auto text-[#0E6251] animate-stamp-thump">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="rubber-stamp stamp-found text-xl px-5 py-2 inline-block animate-stamp-thump">
            FOUND TICKET STAMPED
          </span>
          <h2 className="text-2xl font-display font-extrabold text-[#1E1B18]">
            Item Linked into Campus Safe!
          </h2>
          <p className="text-xs font-mono text-[#6B6258] max-w-sm mx-auto">
            Logged under Claim Ticket #{stampedSuccess}. Redirecting to item ticket page...
          </p>
        </div>
      ) : (
        <div className="bg-[#FCF8F2] rounded-3xl border-3 border-[#0E6251] shadow-md overflow-hidden relative">
          {/* Top Ticket Perforation Header */}
          <div className="p-6 sm:p-8 bg-[#EFE4D3] border-b-2 border-dashed border-[#0E6251]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rubber-stamp stamp-found text-xs mb-2">
                <PlusCircle className="w-3.5 h-3.5" />
                FOUND PROPERTY MANIFEST
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-black text-[#1E1B18] tracking-tight">
                Link a Found Item
              </h1>
              <p className="text-xs text-[#6B6258] mt-1 font-mono">
                [COLLEGE NAME] · Central Dispatch Counter
              </p>
            </div>

            <div className="bg-[#FCF8F2] p-3.5 rounded-2xl border-2 border-[#DECBB6] text-xs font-mono text-[#6B6258] max-w-xs shrink-0">
              <span className="font-bold text-[#0E6251] block mb-0.5">Physical Dropoff:</span>
              Central Security Desk Room 104 or Student Union Desk
            </div>
          </div>

          {/* Form Body styled as printed ticket lines */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {serverError && <Alert type="error" message={serverError} onClose={() => setServerError(null)} />}

            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Item Name &amp; Description"
                name="title"
                required
                placeholder="e.g. Midnight Blue Hydro Flask, Sony Headphones"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                helperText="Brand, model, color, and noticeable marks"
              />

              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                  Category Tag <span className="text-[#D94825]">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl text-sm font-mono border-2 border-[#DECBB6] py-2.5 px-3 bg-[#FCF8F2] text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#0E6251]"
                >
                  {ITEM_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                  Location Discovered <span className="text-[#D94825]">*</span>
                </label>
                <select
                  name="foundLocation"
                  value={formData.foundLocation}
                  onChange={handleChange}
                  className="w-full rounded-xl text-sm font-mono border-2 border-[#DECBB6] py-2.5 px-3 bg-[#FCF8F2] text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#0E6251]"
                >
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                  <option value="custom">Other / Specific Campus Spot...</option>
                </select>
              </div>

              {formData.foundLocation === 'custom' ? (
                <Input
                  label="Specify Exact Location"
                  name="customLocation"
                  required
                  placeholder="e.g. 3rd floor lounge sofa next to window"
                  value={formData.customLocation}
                  onChange={handleChange}
                  error={errors.foundLocation}
                />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Date Found"
                    name="foundDate"
                    type="date"
                    required
                    value={formData.foundDate}
                    onChange={handleChange}
                    error={errors.foundDate}
                  />
                  <Input
                    label="Approx. Time"
                    name="foundTime"
                    type="time"
                    value={formData.foundTime}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            {/* Polaroid Photo Frame Uploader */}
            <ImageUploader
              label="Item Polaroid Photo (Visual Proof)"
              value={formData.imageUrl}
              onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
              userId={user?.id}
              helperText="Snap or drop a photo. Helps the owner recognize their item immediately."
            />

            {/* Ticket Description Field */}
            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                Physical Ticket Notes <span className="text-[#D94825]">*</span>
              </label>
              <textarea
                name="description"
                rows={4}
                required
                placeholder="Describe material, scratches, stickers, condition, and any case or accessory it was with..."
                value={formData.description}
                onChange={handleChange}
                className={`w-full rounded-xl text-sm border-2 p-3.5 bg-[#FCF8F2] font-sans focus:outline-none focus:ring-2 ${
                  errors.description
                    ? 'border-[#D94825] focus:ring-[#D94825]/20'
                    : 'border-[#DECBB6] focus:border-[#0E6251] focus:ring-[#0E6251]/20'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-[#D94825] font-mono font-bold">{errors.description}</p>
              )}
            </div>

            {/* Secret Verification Mark (Anti-Fraud) */}
            <div className="p-4 bg-[#FEF3C7]/60 rounded-2xl border-2 border-dashed border-[#D97706]/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#92400E]">
                <ShieldAlert className="w-4 h-4 text-[#D97706]" />
                <span>CONFIDENTIAL VERIFICATION MARKS (SECURITY ONLY)</span>
              </div>
              <p className="text-[11px] text-[#92400E] font-sans leading-relaxed">
                Details only the true owner would know (e.g., student name on ID inside wallet, custom wallpaper, exact serial number). <strong>This remains concealed from the public claim board</strong>.
              </p>
              <textarea
                name="secretDetails"
                rows={2}
                placeholder="e.g. Serial ending in #4092, dog photo on lock screen, contains dorm key for room 214"
                value={formData.secretDetails}
                onChange={handleChange}
                className="w-full rounded-xl text-xs font-mono border-2 border-[#DECBB6] p-2.5 bg-[#FCF8F2] focus:outline-none focus:ring-2 focus:ring-[#0E6251]"
              />
            </div>

            {/* Storage Locker Bin & Search Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                  Custody Locker / Storage Bin
                </label>
                <select
                  name="storageLocation"
                  value={formData.storageLocation}
                  onChange={handleChange}
                  className="w-full rounded-xl text-sm font-mono border-2 border-[#DECBB6] py-2.5 px-3 bg-[#FCF8F2] text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#0E6251]"
                >
                  {STORAGE_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Search Tags (comma separated)"
                name="tags"
                placeholder="e.g. apple, laptop, stickers, midnight"
                value={formData.tags}
                onChange={handleChange}
                helperText="Keywords to help owner find this ticket"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t-2 border-dashed border-[#DECBB6] flex items-center justify-end gap-3">
              <Link to="/items">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                loadingText="Stamping ticket..."
                leftIcon={<PlusCircle className="w-5 h-5" />}
              >
                Stamp &amp; Link Found Item
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
