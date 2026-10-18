import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Sparkles, CheckCircle2, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Input } from '../components/Input.tsx';
import { Button } from '../components/Button.tsx';
import { Alert } from '../components/Alert.tsx';
import { ImageUploader } from '../components/ImageUploader.tsx';
import { ITEM_CATEGORIES, CAMPUS_LOCATIONS } from '../lib/constants.ts';
import { validateLostReport } from '../lib/validation.ts';
import { lostReportsService } from '../services/lostReports.ts';
import { foundItemsService } from '../services/foundItems.ts';
import { findMatches, MatchResult } from '../lib/matching.ts';

export const LostReportForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: ITEM_CATEGORIES[0].name,
    lastSeenLocation: CAMPUS_LOCATIONS[0].name,
    customLocation: '',
    dateLost: new Date().toISOString().split('T')[0],
    description: '',
    uniqueIdentifiers: '',
    imageUrl: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [instantMatches, setInstantMatches] = useState<MatchResult[] | null>(null);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);
  const [stampedSuccess, setStampedSuccess] = useState(false);

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
      formData.lastSeenLocation === 'custom'
        ? formData.customLocation.trim()
        : formData.lastSeenLocation;

    const validation = validateLostReport({
      title: formData.title,
      category: formData.category,
      description: formData.description,
      lastSeenLocation: actualLocation,
      dateLost: formData.dateLost,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      const created = await lostReportsService.createLostReport(
        {
          title: formData.title.trim(),
          category: formData.category,
          description: formData.description.trim(),
          last_seen_location: actualLocation,
          date_lost: formData.dateLost,
          unique_identifiers: formData.uniqueIdentifiers.trim() || undefined,
          image_url: formData.imageUrl || undefined,
        },
        user?.id || 'guest'
      );

      setSubmittedReportId(created.id);
      setStampedSuccess(true);

      // Algorithmic check against inventory of found items
      const inventory = await foundItemsService.getFoundItems();
      const matches = findMatches(
        {
          id: created.id,
          title: created.title,
          category: created.category,
          description: created.description,
          last_seen_location: created.last_seen_location,
          date_lost: created.date_lost,
        },
        inventory
      );

      setTimeout(() => {
        if (matches.length > 0) {
          setInstantMatches(matches);
        } else {
          navigate('/dashboard');
        }
      }, 900);
    } catch (err: any) {
      console.error('Error submitting lost report:', err);
      setServerError(err.message || 'Failed to submit lost report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-6">
      <div className="mb-6">
        <Link
          to="/items"
          className="font-mono text-xs font-bold text-[#8C6D4F] hover:text-[#1E1B18] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> &larr; Return to Claim Board
        </Link>
      </div>

      {instantMatches && instantMatches.length > 0 ? (
        <div className="bg-[#FCF8F2] rounded-3xl border-3 border-[#D94825] shadow-xl p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <div className="w-16 h-16 bg-[#FCECE8] text-[#D94825] rounded-2xl border-2 border-[#D94825]/30 flex items-center justify-center mx-auto mb-3 shadow-xs animate-stamp-thump">
              <Sparkles className="w-8 h-8 text-[#D94825]" />
            </div>
            <span className="rubber-stamp stamp-lost text-sm mb-2 inline-block">
              POTENTIAL LINKS DETECTED
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-[#1E1B18] tracking-tight">
              We Found {instantMatches.length} Similar Item{instantMatches.length > 1 ? 's' : ''} in Custody!
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6258] mt-2 font-mono">
              Our automated matching system compared your lost ticket against [COLLEGE NAME] inventory.
            </p>
          </div>

          <div className="space-y-4">
            {instantMatches.map((m) => (
              <div
                key={m.item.id}
                className="p-5 border-2 border-[#DECBB6] rounded-2xl bg-[#EFE4D3]/40 hover:bg-[#FCF8F2] hover:border-[#D94825] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {m.item.image_url ? (
                    <img
                      src={m.item.image_url}
                      alt={m.item.title}
                      className="w-18 h-18 rounded-xl object-cover shrink-0 border-2 border-[#DECBB6]"
                    />
                  ) : (
                    <div className="w-18 h-18 rounded-xl bg-[#EFE4D3] flex items-center justify-center text-2xl shrink-0 border border-[#DECBB6]">
                      🏷️
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-[#D94825] text-white px-2.5 py-0.5 rounded">
                        {m.score}% MATCH
                      </span>
                      <span className="font-mono text-xs text-[#8C7E70] uppercase">{m.item.category}</span>
                    </div>
                    <h4 className="text-base font-display font-black text-[#1E1B18] mt-1">{m.item.title}</h4>
                    <p className="text-xs font-mono text-[#6B6258] mt-0.5">Found at {m.item.found_location}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.reasons.map((r, i) => (
                        <span key={i} className="text-[10px] font-mono bg-[#EFE4D3] text-[#6B5035] px-2 py-0.5 rounded border border-[#DECBB6]">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <Link to={`/items/${m.item.id}`} className="w-full sm:w-auto">
                    <Button variant="danger" size="sm" className="w-full" leftIcon={<LinkIcon className="w-3.5 h-3.5" />}>
                      Inspect &amp; Link Claim
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t-2 border-dashed border-[#DECBB6] flex justify-between items-center">
            <span className="text-xs font-mono text-[#8C7E70]">Lost Ticket #{submittedReportId} is active</span>
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                View My Ticket Envelope
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#FCF8F2] rounded-3xl border-3 border-[#D94825] shadow-md overflow-hidden relative">
          {/* Header */}
          <div className="p-6 sm:p-8 bg-[#FCECE8]/60 border-b-2 border-dashed border-[#D94825]/40">
            <div className="inline-flex items-center gap-1.5 rubber-stamp stamp-lost text-xs mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-[#D94825]" />
              LOST PROPERTY CLAIM TICKET
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-[#D94825] tracking-tight">
              Link Your Lost Item
            </h1>
            <p className="text-xs text-[#6B6258] mt-1 font-mono">
              File ticket with [COLLEGE NAME] dispatch · Automatic match notifications
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {serverError && <Alert type="error" message={serverError} onClose={() => setServerError(null)} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Lost Item Name"
                name="title"
                required
                placeholder="e.g. Silver MacBook Air 13-inch, Blue Dorm Keys"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
              />

              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                  Category Tag <span className="text-[#D94825]">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl text-sm font-mono border-2 border-[#DECBB6] py-2.5 px-3 bg-[#FCF8F2] text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#D94825]"
                >
                  {ITEM_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                  Last Seen Location on Campus <span className="text-[#D94825]">*</span>
                </label>
                <select
                  name="lastSeenLocation"
                  value={formData.lastSeenLocation}
                  onChange={handleChange}
                  className="w-full rounded-xl text-sm font-mono border-2 border-[#DECBB6] py-2.5 px-3 bg-[#FCF8F2] text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#D94825]"
                >
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                  <option value="custom">Other / Specific Campus Spot...</option>
                </select>
              </div>

              {formData.lastSeenLocation === 'custom' ? (
                <Input
                  label="Specify Exact Location"
                  name="customLocation"
                  required
                  placeholder="e.g. Science library cafe corner booth"
                  value={formData.customLocation}
                  onChange={handleChange}
                  error={errors.lastSeenLocation}
                />
              ) : (
                <Input
                  label="Date Lost"
                  name="dateLost"
                  type="date"
                  required
                  value={formData.dateLost}
                  onChange={handleChange}
                  error={errors.dateLost}
                />
              )}
            </div>

            <ImageUploader
              label="Old Photo of the Item (Polaroid Reference)"
              value={formData.imageUrl}
              onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
              userId={user?.id}
              helperText="Attach an old photo or purchase invoice for the ticket file"
            />

            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                Ticket Description <span className="text-[#D94825]">*</span>
              </label>
              <textarea
                name="description"
                rows={4}
                required
                placeholder="State color, brand, distinctive stickers, case, wear & tear, or where you remember putting it..."
                value={formData.description}
                onChange={handleChange}
                className={`w-full rounded-xl text-sm border-2 p-3.5 bg-[#FCF8F2] font-sans focus:outline-none focus:ring-2 ${
                  errors.description
                    ? 'border-[#D94825] focus:ring-[#D94825]/20'
                    : 'border-[#DECBB6] focus:border-[#D94825] focus:ring-[#D94825]/20'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-[#D94825] font-mono font-bold">{errors.description}</p>
              )}
            </div>

            <Input
              label="Secret Identifiers (Serial #, Engraving, Custom Lock Screen)"
              name="uniqueIdentifiers"
              placeholder="e.g. Serial ending in C02G, Sticker of NASA, gold keychain ring"
              value={formData.uniqueIdentifiers}
              onChange={handleChange}
              helperText="Used by dispatch staff to confirm ownership when someone turns it in"
            />

            <div className="pt-4 border-t-2 border-dashed border-[#DECBB6] flex items-center justify-end gap-3">
              <Link to="/items">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="orange"
                size="lg"
                isLoading={isSubmitting}
                loadingText="Stamping lost ticket..."
                leftIcon={<AlertCircle className="w-5 h-5" />}
              >
                Stamp &amp; Link Lost Ticket
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
