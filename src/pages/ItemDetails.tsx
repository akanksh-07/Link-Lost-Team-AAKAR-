import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  History,
  Lock,
  Tag,
  Share2,
  Link as LinkIcon,
} from 'lucide-react';
import {
  foundItemsService,
  FoundItem,
  ItemStatusHistoryRecord,
} from '../services/foundItems.ts';
import { claimsService } from '../services/claims.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Button } from '../components/Button.tsx';
import { Modal } from '../components/Modal.tsx';
import { Input } from '../components/Input.tsx';
import { Alert } from '../components/Alert.tsx';
import { Spinner } from '../components/Spinner.tsx';
import { ImageUploader } from '../components/ImageUploader.tsx';
import { formatDate, formatDateTime, formatTimeAgo } from '../lib/formatters.ts';
import { validateClaim } from '../lib/validation.ts';
import { ItemStatus } from '../lib/constants.ts';

export const ItemDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState<FoundItem | null>(null);
  const [history, setHistory] = useState<ItemStatusHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Claim modal state
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [proofDescription, setProofDescription] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [contactPhone, setContactPhone] = useState(profile?.phone_number || '');
  const [claimErrors, setClaimErrors] = useState<{ [key: string]: string }>({});
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Admin status transition modal state
  const [isAdminStatusModalOpen, setIsAdminStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ItemStatus>('claimed');
  const [statusReason, setStatusReason] = useState('');
  const [statusStorageLocation, setStatusStorageLocation] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchItemAndHistory = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await foundItemsService.getFoundItemById(id);
      setItem(data);
      if (data) {
        setStatusStorageLocation(data.storage_location || '');
        const logs = await foundItemsService.getItemStatusHistory(id);
        setHistory(logs);
      }
    } catch (err) {
      console.error('Error fetching item details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemAndHistory();
  }, [id]);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !user) return;

    const validation = validateClaim({ proofDescription, contactPhone });
    if (!validation.isValid) {
      setClaimErrors(validation.errors);
      return;
    }
    setClaimErrors({});
    setClaimSubmitting(true);

    try {
      await claimsService.submitClaim(
        {
          itemId: item.id,
          proofDescription,
          proofImageUrl,
          contactPhone,
        },
        profile || user
      );
      setClaimSuccess(true);
      setTimeout(() => {
        setIsClaimModalOpen(false);
        fetchItemAndHistory();
      }, 1500);
    } catch (err: any) {
      setClaimErrors({ submit: err.message || 'Failed to submit claim ticket. Please try again.' });
    } finally {
      setClaimSubmitting(false);
    }
  };

  const handleAdminStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!statusReason.trim()) {
      alert('Audit compliance requires an official reason for changing item status.');
      return;
    }

    setStatusUpdating(true);
    try {
      await foundItemsService.updateItemStatus(
        item.id,
        newStatus,
        statusReason,
        profile || user,
        { storage_location: statusStorageLocation }
      );
      setIsAdminStatusModalOpen(false);
      setStatusReason('');
      await fetchItemAndHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to update item status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Spinner size="xl" />
        <p className="mt-4 text-sm font-mono font-bold text-[#6B6258]">
          Retrieving ticket record from campus registry...
        </p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-[#FCF8F2] border-2 border-[#DECBB6] p-8 rounded-3xl">
        <h2 className="text-xl font-display font-extrabold text-[#1E1B18] mb-2">Claim Ticket Not Found</h2>
        <p className="text-xs font-mono text-[#6B6258] mb-6">
          The requested ticket #{id} could not be located in [COLLEGE NAME] archives.
        </p>
        <Link to="/items">
          <Button variant="primary">Return to Claim Board</Button>
        </Link>
      </div>
    );
  }

  const ticketNumber = item.id.replace(/[^0-9]/g, '').padStart(4, '0') || '0427';
  const isReturned = item.status === 'returned';

  return (
    <div className="max-w-5xl mx-auto my-6 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/items"
          className="font-mono text-xs font-bold text-[#8C6D4F] hover:text-[#1E1B18] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> &larr; Return to Claim Board
        </Link>

        <button
          onClick={handleShare}
          className="text-xs font-mono font-bold text-[#6B6258] hover:text-[#1E1B18] flex items-center gap-1.5 bg-[#FCF8F2] border-2 border-[#DECBB6] px-3.5 py-1.5 rounded-xl shadow-2xs hover:bg-[#EFE4D3] transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          {copiedLink ? 'Ticket URL Copied!' : 'Share Ticket'}
        </button>
      </div>

      {/* Main Claim Ticket Display */}
      <div className="bg-[#FCF8F2] rounded-3xl border-3 border-[#DECBB6] shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-12 relative">
        {/* String eyelet hole top indicator */}
        <div className="md:col-span-12 bg-[#EFE4D3] px-6 py-2.5 border-b-2 border-dashed border-[#DECBB6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-[#8C6D4F] bg-[#FCF8F2] inline-block shadow-inner" />
            <span className="font-mono text-xs font-black text-[#8C6D4F] tracking-wider uppercase">
              Official Campus Claim Ticket No. {ticketNumber}
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#8C7E70] uppercase">
            [COLLEGE NAME] Security Custody
          </span>
        </div>

        {/* Left Column: Big Photo with Rubber Stamp Overlay */}
        <div className="md:col-span-5 bg-[#EAE0D0] flex flex-col items-center justify-center relative min-h-[320px] md:min-h-[460px] overflow-hidden border-b md:border-b-0 md:border-r-2 border-dashed border-[#DECBB6]">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover max-h-[500px]"
            />
          ) : (
            <div className="text-center p-8 text-[#8C7E70]">
              <span className="text-5xl block mb-2">📦</span>
              <p className="text-sm font-mono font-bold text-[#1E1B18]">No photo attached to manifest</p>
              <p className="text-xs font-mono text-[#8C7E70] mt-1">Stored securely in campus dispatch</p>
            </div>
          )}

          <div className="absolute top-4 left-4">
            <StatusBadge status={item.status} size="md" />
          </div>

          {item.is_verified && (
            <div className="absolute top-4 right-4 bg-[#FCF8F2]/95 text-[#0E6251] px-2.5 py-1 rounded-lg border border-[#0E6251]/30 font-mono text-xs font-bold flex items-center gap-1 shadow-md">
              <ShieldCheck className="w-4 h-4 text-[#0E6251]" />
              Official Tag
            </div>
          )}

          {/* SIGNATURE ELEMENT: Prominent RETURNED Stamp with subtext */}
          {isReturned && (
            <div className="absolute inset-0 bg-[#FCF8F2]/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center animate-stamp-thump">
              <span className="rubber-stamp stamp-returned text-3xl sm:text-4xl px-6 py-2.5 shadow-xl -rotate-6">
                RETURNED
              </span>
              <span className="text-sm font-mono font-black text-[#0E6251] bg-[#FCF8F2] px-3 py-1 rounded-md mt-3 border-2 border-[#0E6251] shadow-sm">
                Item linked to its owner
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Ticket Stub Details & Link Action */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#0E6251] bg-[#E7F3F0] px-2.5 py-0.5 rounded border border-[#0E6251]/20">
                {item.category}
              </span>
              <span className="text-xs font-mono text-[#8C7E70]">System Ref: {item.id}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-black text-[#1E1B18] tracking-tight mb-3">
              {item.title}
            </h1>

            <p className="text-sm text-[#6B6258] leading-relaxed mb-6 font-sans whitespace-pre-line">
              {item.description}
            </p>

            {/* Ticket Manifest Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4.5 bg-[#EFE4D3]/50 rounded-2xl border-2 border-dashed border-[#DECBB6] mb-6 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[#8C7E70] font-bold uppercase text-[10px] tracking-wider block">
                  Location Discovered
                </span>
                <div className="flex items-center gap-1.5 font-bold text-[#1E1B18]">
                  <MapPin className="w-4 h-4 text-[#D94825] shrink-0" />
                  <span>{item.found_location}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[#8C7E70] font-bold uppercase text-[10px] tracking-wider block">
                  Discovery Date &amp; Time
                </span>
                <div className="flex items-center gap-1.5 font-bold text-[#1E1B18]">
                  <Calendar className="w-4 h-4 text-[#0E6251] shrink-0" />
                  <span>
                    {formatDate(item.found_date)} {item.found_time ? `at ${item.found_time}` : ''}
                  </span>
                </div>
              </div>

              {item.storage_location && (
                <div className="sm:col-span-2 space-y-1 pt-2.5 border-t border-dashed border-[#DECBB6]">
                  <span className="text-[#8C7E70] font-bold uppercase text-[10px] tracking-wider block">
                    Campus Custody Locker
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-[#1E1B18]">
                    <Lock className="w-4 h-4 text-[#8C6D4F] shrink-0" />
                    <span>{item.storage_location}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mb-6">
                <Tag className="w-3.5 h-3.5 text-[#8C7E70]" />
                {item.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-[11px] bg-[#EFE4D3] text-[#6B5035] font-semibold px-2 py-0.5 rounded border border-[#DECBB6]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Secret Verification Mark (Admin only) */}
            {isAdmin && item.secret_identifying_details && (
              <div className="p-3.5 bg-[#FEF3C7] rounded-xl border-2 border-dashed border-[#D97706]/40 text-xs text-[#92400E] mb-6 font-mono">
                <span className="font-bold block mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-[#D97706]" /> Security Secret Verification Marks (Dispatcher View):
                </span>
                <p className="bg-[#FCF8F2] p-2 rounded border border-[#D97706]/30">
                  {item.secret_identifying_details}
                </p>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-6 border-t-2 border-dashed border-[#DECBB6] flex flex-wrap items-center justify-between gap-3">
            {item.status === 'unclaimed' ? (
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="teal"
                  size="lg"
                  onClick={() => setIsClaimModalOpen(true)}
                  leftIcon={<LinkIcon className="w-5 h-5" />}
                  className="w-full sm:w-auto"
                >
                  This Is Mine · Link My Claim
                </Button>
                <Link to="/report-found" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    leftIcon={<CheckCircle2 className="w-4 h-4 text-[#0E6251]" />}
                    className="w-full"
                  >
                    I Found A Matching Item
                  </Button>
                </Link>
              </div>
            ) : item.status === 'in_review' ? (
              <div className="p-3.5 rounded-2xl bg-[#FEF3C7] text-[#92400E] border-2 border-[#D97706]/30 text-xs font-mono flex items-center gap-2">
                <Spinner size="sm" />
                <span>Claim verification in progress at [COLLEGE NAME] Security Desk.</span>
              </div>
            ) : item.status === 'returned' ? (
              <div className="p-3.5 rounded-2xl bg-[#EAF5E9] text-[#15803D] border-2 border-[#15803D]/30 text-xs font-mono font-black flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
                <span>Returned: Item linked to its owner</span>
              </div>
            ) : (
              <div className="text-xs font-mono text-[#6B6258] font-bold">
                Ticket Status: <strong>{item.status.toUpperCase()}</strong>
              </div>
            )}

            {isAdmin && (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setNewStatus(item.status);
                  setIsAdminStatusModalOpen(true);
                }}
              >
                Update Dispatch Status (Staff)
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Dispatch Audit History Ledger */}
      <section aria-labelledby="audit-history-heading" className="bg-[#FCF8F2] rounded-3xl border-2 border-[#DECBB6] p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-dashed border-[#DECBB6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFE4D3] text-[#8C6D4F] flex items-center justify-center border border-[#DECBB6]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 id="audit-history-heading" className="text-xl font-display font-black text-[#1E1B18]">
                Ticket Dispatch &amp; Status Audit Ledger
              </h2>
              <p className="text-xs text-[#6B6258] font-mono">
                Verifiable chain of custody across [COLLEGE NAME] security stations
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#8C6D4F]">
            {history.length} {history.length === 1 ? 'entry' : 'entries'} logged
          </span>
        </div>

        {history.length === 0 ? (
          <p className="text-xs font-mono text-[#8C7E70] py-4 text-center">No ledger entries found.</p>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DECBB6]">
            {history.map((log) => (
              <div key={log.id} className="relative group">
                <div className="absolute -left-6 sm:-left-8 top-1.5 w-4 h-4 rounded-full bg-[#FCF8F2] border-3 border-[#0E6251] group-hover:scale-115 transition-transform" />

                <div className="bg-[#EFE4D3]/50 border-2 border-[#DECBB6] rounded-2xl p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#1E1B18]">{log.changer_name}</span>
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#DECBB6] text-[#6B5035]">
                        {log.changer_role}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#8C7E70]">
                      {formatDateTime(log.created_at)} ({formatTimeAgo(log.created_at)})
                    </span>
                  </div>

                  <div className="text-xs font-mono font-bold text-[#1E1B18]">
                    {log.old_status ? (
                      <span>
                        Status shifted: <span className="text-[#8C7E70]">{log.old_status}</span> &rarr;{' '}
                        <span className="text-[#0E6251]">{log.new_status}</span>
                      </span>
                    ) : (
                      <span>
                        Ticket created with status <span className="text-[#0E6251]">{log.new_status}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#6B6258] bg-[#FCF8F2] p-3 rounded-xl border border-[#DECBB6] font-sans leading-relaxed">
                    "{log.reason}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Claim Submission Modal */}
      <Modal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        title="Link Claim for This Item"
        description="Provide distinctive details to confirm that you are the rightful owner. Security staff will review your submission."
      >
        {claimSuccess ? (
          <div className="py-6 text-center">
            <div className="w-14 h-14 bg-[#EAF5E9] text-[#15803D] rounded-2xl border-2 border-[#15803D]/30 flex items-center justify-center mx-auto mb-3 animate-stamp-thump">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <span className="rubber-stamp stamp-found text-sm mb-2 inline-block">
              CLAIM TICKET LOGGED
            </span>
            <h4 className="text-xl font-display font-extrabold text-[#1E1B18] mb-1">
              Claim Ticket Linked!
            </h4>
            <p className="text-xs text-[#6B6258] max-w-sm mx-auto font-mono">
              Item status marked as IN REVIEW. Campus security will contact your phone or email for pickup.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitClaim} className="space-y-4">
            {claimErrors.submit && <Alert type="error" message={claimErrors.submit} />}

            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                Proof of Ownership Evidence <span className="text-[#D94825]">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="State serial numbers, custom lock screen, scratch marks, stickers, specific internal contents, or date/time you left it..."
                value={proofDescription}
                onChange={(e) => setProofDescription(e.target.value)}
                className={`w-full rounded-xl text-sm border-2 p-3 bg-[#FCF8F2] font-sans focus:outline-none focus:ring-2 ${
                  claimErrors.proofDescription
                    ? 'border-[#D94825] focus:ring-[#D94825]/20'
                    : 'border-[#DECBB6] focus:border-[#0E6251] focus:ring-[#0E6251]/20'
                }`}
              />
              {claimErrors.proofDescription && (
                <p className="mt-1 text-xs text-[#D94825] font-mono font-bold">{claimErrors.proofDescription}</p>
              )}
            </div>

            <ImageUploader
              label="Attach Ownership Proof (Receipt / Box / Prior Picture)"
              value={proofImageUrl}
              onChange={setProofImageUrl}
              bucket="claim-proofs"
              userId={user?.id}
              helperText="Upload purchase receipt, invoice, or previous photograph"
            />

            <Input
              label="Contact Phone Number"
              type="tel"
              required
              placeholder="+1 (555) 019-2834"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              error={claimErrors.contactPhone}
            />

            <div className="pt-2 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsClaimModalOpen(false)}
                disabled={claimSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="teal"
                isLoading={claimSubmitting}
                loadingText="Submitting claim..."
                leftIcon={<LinkIcon className="w-4 h-4" />}
              >
                Submit Claim Ticket
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Admin Status Change Modal */}
      {isAdmin && (
        <Modal
          isOpen={isAdminStatusModalOpen}
          onClose={() => setIsAdminStatusModalOpen(false)}
          title="Dispatcher Status Transition"
          description="Update item lifecycle status. Recorded permanently in [COLLEGE NAME] ledger."
        >
          <form onSubmit={handleAdminStatusChange} className="space-y-4">
            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                New Target Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ItemStatus)}
                className="w-full rounded-xl text-sm font-mono border-2 border-[#DECBB6] py-2.5 px-3 bg-[#FCF8F2] text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#0E6251]"
              >
                <option value="unclaimed">FOUND · UNCLAIMED</option>
                <option value="in_review">IN REVIEW (Claim Under Investigation)</option>
                <option value="claimed">CLAIM APPROVED (Awaiting Pickup)</option>
                <option value="returned">RETURNED (Item linked to its owner)</option>
                <option value="archived">ARCHIVED (Past Retention Window)</option>
              </select>
            </div>

            <Input
              label="Locker / Storage Safe Bin"
              value={statusStorageLocation}
              onChange={(e) => setStatusStorageLocation(e.target.value)}
              placeholder="e.g. Central Security Desk - Bin A2"
            />

            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                Audit Reason / Justification <span className="text-[#D94825]">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="State reason for status transition (e.g. verified student roll ID, handed back to owner)..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full rounded-xl text-sm font-mono border-2 border-[#DECBB6] p-3 bg-[#FCF8F2] focus:outline-none focus:ring-2 focus:ring-[#0E6251]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAdminStatusModalOpen(false)}
                disabled={statusUpdating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="teal"
                isLoading={statusUpdating}
                loadingText="Committing to Ledger..."
              >
                Commit Status to Ledger
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
