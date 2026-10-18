import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  MapPin,
  Tag,
  Link as LinkIcon,
  CheckCircle2,
  Calendar,
  Building2,
  Inbox,
} from 'lucide-react';
import { foundItemsService, FoundItem } from '../services/foundItems.ts';
import { lostReportsService, LostReport } from '../services/lostReports.ts';
import { ITEM_CATEGORIES, CAMPUS_LOCATIONS } from '../lib/constants.ts';
import { ItemCard } from '../components/ItemCard.tsx';
import { Spinner } from '../components/Spinner.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { Button } from '../components/Button.tsx';
import { Modal } from '../components/Modal.tsx';
import { Input } from '../components/Input.tsx';
import { Alert } from '../components/Alert.tsx';
import { ImageUploader } from '../components/ImageUploader.tsx';
import { validateClaim } from '../lib/validation.ts';
import { claimsService } from '../services/claims.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../supabaseClient.ts';
import { LostLinkWordmark } from '../components/Logo.tsx';

type TicketFilterType = 'all' | 'found' | 'lost';
type DateFilterType = 'all' | 'today' | '3days' | 'week' | 'month';

export const BrowseItems: React.FC = () => {
  const { user, profile } = useAuth();

  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [lostReports, setLostReports] = useState<LostReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [ticketType, setTicketType] = useState<TicketFilterType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Quick Claim Modal State (For Found Items)
  const [claimTarget, setClaimTarget] = useState<FoundItem | null>(null);
  const [proofDescription, setProofDescription] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [contactPhone, setContactPhone] = useState(profile?.phone_number || '');
  const [claimErrors, setClaimErrors] = useState<{ [key: string]: string }>({});
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // "I Found This!" Modal State (For Lost Reports)
  const [foundThisTarget, setFoundThisTarget] = useState<LostReport | null>(null);
  const [finderNotes, setFinderNotes] = useState('');
  const [finderLocation, setFinderLocation] = useState('');
  const [finderSuccess, setFinderSuccess] = useState(false);
  const [finderSubmitting, setFinderSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fItems, lReports] = await Promise.all([
        foundItemsService.getFoundItems({
          search,
          category: selectedCategory,
          location: selectedLocation,
        }),
        lostReportsService.getLostReports(),
      ]);
      setFoundItems(fItems);
      setLostReports(lReports);
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory, selectedLocation]);

  // Realtime updates subscription
  useEffect(() => {
    const channel = supabase
      .channel('public:tickets')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      if (typeof supabase.removeChannel === 'function') {
        supabase.removeChannel(channel);
      }
    };
  }, [search, selectedCategory, selectedLocation]);

  // Helper date filter check
  const isDateInRange = (dateStr: string) => {
    if (dateFilter === 'all') return true;
    const itemDate = new Date(dateStr).getTime();
    const now = Date.now();
    const diffHours = (now - itemDate) / (1000 * 60 * 60);

    if (dateFilter === 'today') return diffHours <= 24;
    if (dateFilter === '3days') return diffHours <= 72;
    if (dateFilter === 'week') return diffHours <= 168;
    if (dateFilter === 'month') return diffHours <= 720;
    return true;
  };

  // Filter lost reports locally by category, search, location & date
  const filteredLost = lostReports.filter((report) => {
    if (selectedCategory !== 'all' && report.category !== selectedCategory) return false;
    if (selectedLocation !== 'all' && !report.last_seen_location.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        report.title.toLowerCase().includes(q) ||
        report.description.toLowerCase().includes(q) ||
        report.last_seen_location.toLowerCase().includes(q) ||
        report.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return isDateInRange(report.date_lost);
  });

  // Filter found items by date range as well
  const filteredFound = foundItems.filter((item) => isDateInRange(item.found_date));

  // Combine or select tickets based on ticketType
  type UnifiedItem = { item: FoundItem | LostReport; type: 'found' | 'lost'; date: string };
  const unifiedTickets: UnifiedItem[] = [];

  if (ticketType === 'all' || ticketType === 'found') {
    filteredFound.forEach((i) => unifiedTickets.push({ item: i, type: 'found', date: i.found_date }));
  }
  if (ticketType === 'all' || ticketType === 'lost') {
    filteredLost.forEach((l) => unifiedTickets.push({ item: l, type: 'lost', date: l.date_lost }));
  }

  // Sort by date descending
  unifiedTickets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Handle open Claim
  const handleOpenClaim = (item: FoundItem) => {
    setClaimTarget(item);
    setProofDescription('');
    setProofImageUrl('');
    setContactPhone(profile?.phone_number || '');
    setClaimErrors({});
    setClaimSuccess(false);
  };

  // Submit Claim
  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimTarget || !user) return;

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
          itemId: claimTarget.id,
          proofDescription,
          proofImageUrl,
          contactPhone,
        },
        profile || user
      );
      setClaimSuccess(true);
      setTimeout(() => {
        setClaimTarget(null);
        fetchData();
      }, 1500);
    } catch (err: any) {
      setClaimErrors({ submit: err.message || 'Failed to link claim ticket. Please try again.' });
    } finally {
      setClaimSubmitting(false);
    }
  };

  // Handle "I Found This!" on a lost report
  const handleOpenFoundThis = (report: LostReport) => {
    setFoundThisTarget(report);
    setFinderNotes('');
    setFinderLocation(report.last_seen_location);
    setFinderSuccess(false);
  };

  const handleSubmitFoundThis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundThisTarget) return;

    setFinderSubmitting(true);
    try {
      // Auto-create a found item ticket referencing this lost report
      await foundItemsService.createFoundItem(
        {
          title: `Found: ${foundThisTarget.title}`,
          category: foundThisTarget.category,
          description: finderNotes.trim() || `Student linked matching property for lost ticket #${foundThisTarget.id}`,
          found_location: finderLocation || foundThisTarget.last_seen_location,
          found_date: new Date().toISOString().split('T')[0],
          storage_location: 'Central Security Desk - Bin A1',
        },
        profile || user
      );
      setFinderSuccess(true);
      setTimeout(() => {
        setFoundThisTarget(null);
        fetchData();
      }, 1600);
    } catch (err: any) {
      alert(err.message || 'Failed to submit found report');
    } finally {
      setFinderSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Hero Section with Claim Ticket Motif & Side-by-Side Action Tickets */}
      <section aria-labelledby="hero-heading" className="relative">
        <div className="text-center max-w-3xl mx-auto mb-8 pt-4">
          <div className="inline-flex items-center gap-2 bg-[#FCF8F2] border-2 border-[#DECBB6] px-3.5 py-1.5 rounded-full font-mono text-xs font-bold text-[#8C6D4F] uppercase tracking-wider mb-4 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#D94825] animate-ping" />
            [COLLEGE NAME] Official Property Registry
          </div>

          <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-[#1E1B18] tracking-tight leading-[1.08] mb-4">
            <LostLinkWordmark size="xl" />
          </h1>

          <p className="text-xl sm:text-2xl font-display font-bold text-[#D94825] mb-2 tracking-tight">
            Lost it? Link it back.
          </p>
          <p className="text-sm sm:text-base text-[#6B6258] font-sans max-w-xl mx-auto leading-relaxed">
            The campus claim ticket network linking misplaced belongings, student IDs, keys, and backpacks back to their owners.
          </p>
        </div>

        {/* Two Large Side-by-Side Action Tickets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Action Ticket 1: I LOST SOMETHING (Red-Orange) */}
          <Link
            to="/report-lost"
            className="group relative bg-[#FCF8F2] rounded-3xl border-3 border-[#D94825] p-7 shadow-[0_8px_24px_rgba(217,72,37,0.12)] hover:shadow-[0_12px_32px_rgba(217,72,37,0.22)] transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
          >
            {/* Top eyelet punch hole */}
            <div className="absolute top-3 right-5 flex items-center gap-1.5 font-mono text-xs font-extrabold text-[#D94825]">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-[#D94825] bg-[#F4ECE1] inline-block" />
              TICKET / LOST
            </div>

            <div className="mb-6 pt-2">
              <span className="rubber-stamp stamp-lost text-xs mb-3 inline-block">
                SIGNAL RED
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-[#D94825] tracking-tight">
                I LOST SOMETHING
              </h2>
              <p className="text-xs sm:text-sm text-[#6B6258] mt-2 font-sans leading-relaxed">
                Misplaced your phone, keys, ID card, or notebook on campus? File a lost ticket and our automated engine will monitor incoming inventory.
              </p>
            </div>

            <div className="pt-4 border-t-2 border-dashed border-[#D94825]/30 flex items-center justify-between text-[#D94825]">
              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                Link Lost Item &rarr;
              </span>
              <div className="w-10 h-10 rounded-full bg-[#D94825] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
          </Link>

          {/* Action Ticket 2: I FOUND SOMETHING (Deep Teal) */}
          <Link
            to="/report-found"
            className="group relative bg-[#FCF8F2] rounded-3xl border-3 border-[#0E6251] p-7 shadow-[0_8px_24px_rgba(14,98,81,0.12)] hover:shadow-[0_12px_32px_rgba(14,98,81,0.22)] transition-all duration-200 transform hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
          >
            {/* Top eyelet punch hole */}
            <div className="absolute top-3 right-5 flex items-center gap-1.5 font-mono text-xs font-extrabold text-[#0E6251]">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-[#0E6251] bg-[#F4ECE1] inline-block" />
              TICKET / FOUND
            </div>

            <div className="mb-6 pt-2">
              <span className="rubber-stamp stamp-found text-xs mb-3 inline-block">
                DEEP TEAL
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-[#0E6251] tracking-tight">
                I FOUND SOMETHING
              </h2>
              <p className="text-xs sm:text-sm text-[#6B6258] mt-2 font-sans leading-relaxed">
                Found personal property in a lecture hall, dorm lounge, or library? Log a found ticket and link it into security custody so the owner can reclaim it.
              </p>
            </div>

            <div className="pt-4 border-t-2 border-dashed border-[#0E6251]/30 flex items-center justify-between text-[#0E6251]">
              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                Link Found Item &rarr;
              </span>
              <div className="w-10 h-10 rounded-full bg-[#0E6251] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <PlusCircle className="w-5 h-5" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Ticket-Counter Search Slot & Tag Filters */}
      <div className="bg-[#FCF8F2] rounded-3xl border-3 border-[#DECBB6] p-6 sm:p-7 shadow-sm space-y-5">
        {/* Ticket-Counter Slot Search Bar */}
        <div className="relative">
          <div className="bg-[#EFE4D3] p-1.5 rounded-2xl border-2 border-[#DECBB6] flex items-center shadow-inner">
            <div className="pl-3.5 pr-2 text-[#8C6D4F] flex items-center gap-2 font-mono text-xs font-bold shrink-0">
              <Search className="w-4 h-4 text-[#8C6D4F]" />
              <span className="hidden sm:inline">COUNTER SLOT:</span>
            </div>
            <input
              type="text"
              placeholder="Search claim tickets by keyword, serial no., item name (e.g. 'AirPods', 'MacBook', 'North Hall')..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FCF8F2] px-4 py-2.5 rounded-xl border border-[#DECBB6] text-sm text-[#1E1B18] placeholder-[#A69584] focus:outline-none focus:ring-2 focus:ring-[#0E6251] font-mono"
            />
          </div>
        </div>

        {/* Primary Filter Strip: Lost / Found Toggle & Date Window */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-b-2 border-dashed border-[#DECBB6] pb-4">
          {/* Lost / Found Tag Toggle */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#8C6D4F] uppercase tracking-wider shrink-0 mr-1">
              Filter By Type:
            </span>
            <button
              type="button"
              onClick={() => setTicketType('all')}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                ticketType === 'all'
                  ? 'bg-[#1E1B18] text-white border-[#1E1B18] shadow-xs'
                  : 'bg-[#EFE4D3] text-[#6B6258] border-[#DECBB6] hover:bg-[#DECBB6]'
              }`}
            >
              All Claim Tickets ({foundItems.length + lostReports.length})
            </button>
            <button
              type="button"
              onClick={() => setTicketType('found')}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                ticketType === 'found'
                  ? 'bg-[#0E6251] text-white border-[#0E6251] shadow-xs font-black'
                  : 'bg-[#E7F3F0] text-[#0E6251] border-[#0E6251]/30 hover:bg-[#D5EAE5]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#0E6251] inline-block" />
              FOUND ({foundItems.length})
            </button>
            <button
              type="button"
              onClick={() => setTicketType('lost')}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                ticketType === 'lost'
                  ? 'bg-[#D94825] text-white border-[#D94825] shadow-xs font-black'
                  : 'bg-[#FCECE8] text-[#D94825] border-[#D94825]/30 hover:bg-[#F9DAD2]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#D94825] inline-block" />
              LOST ({lostReports.length})
            </button>
          </div>

          {/* Date Tag Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="font-mono text-xs font-bold text-[#8C6D4F] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5" /> Date:
            </span>
            {(
              [
                { id: 'all', label: 'All Dates' },
                { id: 'today', label: 'Today' },
                { id: '3days', label: '3 Days' },
                { id: 'week', label: 'Past Week' },
                { id: 'month', label: 'Past Month' },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDateFilter(d.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold shrink-0 transition-colors cursor-pointer border ${
                  dateFilter === d.id
                    ? 'bg-[#8C6D4F] text-white border-[#8C6D4F]'
                    : 'bg-[#EFE4D3]/70 text-[#6B6258] border-[#DECBB6] hover:bg-[#DECBB6]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location Select Slot */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Building2 className="w-4 h-4 text-[#8C6D4F] shrink-0" />
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] shrink-0">
              Campus Building / Zone:
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              aria-label="Filter by Campus Location"
              className="py-1.5 px-3 rounded-xl border-2 border-[#DECBB6] text-xs font-mono bg-[#FFFDF9] text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#0E6251] max-w-xs"
            >
              <option value="all">All Campus Sectors</option>
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.building}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="text-xs font-mono font-bold text-[#6B6258] hover:text-[#1E1B18] flex items-center gap-1.5 bg-[#FCF8F2] border-2 border-[#DECBB6] px-3 py-1.5 rounded-xl shadow-2xs hover:bg-[#EFE4D3] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Inventory
          </button>
        </div>

        {/* Tag Labels Filter Strip */}
        <div className="pt-2 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="font-mono text-xs font-bold text-[#8C6D4F] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Tag className="w-3.5 h-3.5" /> Category Tags:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 transition-colors cursor-pointer border ${
              selectedCategory === 'all'
                ? 'bg-[#1E1B18] text-[#FCF8F2] border-[#1E1B18]'
                : 'bg-[#EFE4D3] text-[#6B6258] border-[#DECBB6] hover:bg-[#DECBB6]'
            }`}
          >
            All Categories
          </button>
          {ITEM_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 transition-colors cursor-pointer border ${
                selectedCategory === cat.name
                  ? 'bg-[#0E6251] text-white border-[#0E6251]'
                  : 'bg-[#EFE4D3] text-[#6B6258] border-[#DECBB6] hover:bg-[#DECBB6]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Claim Board Feed Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-2xl font-display font-black text-[#1E1B18] tracking-tight flex items-center gap-2.5">
            <span>Campus Claim Board</span>
            <span className="font-mono text-xs font-bold text-[#0E6251] bg-[#E7F3F0] px-2.5 py-0.5 rounded-full border border-[#0E6251]/20">
              {unifiedTickets.length} {unifiedTickets.length === 1 ? 'ticket' : 'tickets'} pinned
            </span>
          </h2>
          <p className="text-xs text-[#6B6258] mt-0.5 font-mono">
            Physical items secured at [COLLEGE NAME] Security Desk Room 104
          </p>
        </div>
      </div>

      {/* Staggered Claim Tickets Feed */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm font-mono font-bold text-[#6B6258]">
            Scanning ticket inventory...
          </p>
        </div>
      ) : unifiedTickets.length === 0 ? (
        <EmptyState
          title="No Claim Tickets Found"
          description="We couldn't locate any items matching your counter search. Check your filters, or link a lost item ticket so security can monitor for it."
          action={
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setSelectedLocation('all');
                  setTicketType('all');
                  setDateFilter('all');
                }}
              >
                Reset Filters
              </Button>
              <Link to="/report-lost">
                <Button variant="danger" size="sm">
                  Link a Lost Item
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        /* Staggered Masonry Feed Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 items-start">
          {unifiedTickets.map(({ item, type }, idx) => (
            <div
              key={item.id}
              className={`transition-transform duration-200 ${
                idx % 3 === 1 ? 'sm:translate-y-4' : idx % 3 === 2 ? 'lg:-translate-y-2' : ''
              }`}
            >
              <ItemCard
                item={item}
                type={type}
                onClaimClick={handleOpenClaim}
                onFoundThisClick={handleOpenFoundThis}
              />
            </div>
          ))}
        </div>
      )}

      {/* Quick Claim Modal (For Found Items) */}
      {claimTarget && (
        <Modal
          isOpen={Boolean(claimTarget)}
          onClose={() => setClaimTarget(null)}
          title={`Link Claim: ${claimTarget.title}`}
          description="Provide ownership proof to link this item back to you. Campus dispatch verifies all submissions."
          maxWidth="lg"
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
              <p className="text-xs text-[#6B6258] max-w-sm mx-auto font-sans leading-relaxed">
                Your claim has been stamped as <strong>IN REVIEW</strong>. Security staff will examine your evidence and notify your dashboard.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitClaim} className="space-y-4">
              {claimErrors.submit && <Alert type="error" message={claimErrors.submit} />}

              <div className="p-3.5 bg-[#EFE4D3]/60 rounded-2xl border-2 border-dashed border-[#DECBB6] text-xs font-mono space-y-1">
                <p>
                  <strong>Ticket:</strong> {claimTarget.title} ({claimTarget.category})
                </p>
                <p>
                  <strong>Found At:</strong> {claimTarget.found_location}
                </p>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                  Proof of Ownership Evidence <span className="text-[#D94825]">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail unique marks only the true owner would know: serial number, custom lock screen, stickers, exact wallet contents, distinctive scratches..."
                  value={proofDescription}
                  onChange={(e) => setProofDescription(e.target.value)}
                  className={`w-full rounded-xl text-sm border-2 p-3 bg-[#FCF8F2] focus:outline-none focus:ring-2 font-sans ${
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
                label="Optional Evidence Photo (Receipt, Box, Prior Photo)"
                value={proofImageUrl}
                onChange={setProofImageUrl}
                bucket="claim-proofs"
                userId={user?.id}
                helperText="Upload purchase invoice, packaging photo, or prior photo"
              />

              <Input
                label="Holder Contact Phone Number"
                type="tel"
                required
                placeholder="+1 (555) 019-2834"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                error={claimErrors.contactPhone}
                helperText="Campus dispatch calls or texts this number for pickup coordination"
              />

              <div className="pt-2 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setClaimTarget(null)}
                  disabled={claimSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="teal"
                  isLoading={claimSubmitting}
                  loadingText="Linking claim..."
                  leftIcon={<LinkIcon className="w-4 h-4" />}
                >
                  Submit Official Claim Ticket
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* "I Found This!" Modal (For Lost Reports) */}
      {foundThisTarget && (
        <Modal
          isOpen={Boolean(foundThisTarget)}
          onClose={() => setFoundThisTarget(null)}
          title={`Link Found Item: ${foundThisTarget.title}`}
          description="Thank you for helping link this lost item back to its student owner! Provide details of where you located it."
        >
          {finderSuccess ? (
            <div className="py-6 text-center">
              <div className="w-14 h-14 bg-[#EAF5E9] text-[#15803D] rounded-2xl border-2 border-[#15803D]/30 flex items-center justify-center mx-auto mb-3 animate-stamp-thump">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <span className="rubber-stamp stamp-found text-sm mb-2 inline-block">
                FOUND TICKET LINKED
              </span>
              <h4 className="text-xl font-display font-extrabold text-[#1E1B18] mb-1">
                Linked to Lost Ticket #{foundThisTarget.id}!
              </h4>
              <p className="text-xs text-[#6B6258] max-w-sm mx-auto font-mono">
                Item logged into campus safe custody. Security will notify the owner.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitFoundThis} className="space-y-4">
              <div className="p-3.5 bg-[#FCECE8]/60 rounded-2xl border-2 border-dashed border-[#D94825]/40 text-xs font-mono space-y-1">
                <p>
                  <strong>Lost Item:</strong> {foundThisTarget.title} ({foundThisTarget.category})
                </p>
                <p>
                  <strong>Reported Last Seen:</strong> {foundThisTarget.last_seen_location}
                </p>
              </div>

              <Input
                label="Where Did You Spot or Collect This Item?"
                required
                placeholder="e.g. Science Library Room 204 or Left at Front Desk"
                value={finderLocation}
                onChange={(e) => setFinderLocation(e.target.value)}
              />

              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                  Finder Notes / Condition Upon Retrieval
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Handed to librarian or currently bringing to Central Security Desk Room 104..."
                  value={finderNotes}
                  onChange={(e) => setFinderNotes(e.target.value)}
                  className="w-full rounded-xl text-sm border-2 border-[#DECBB6] p-3 bg-[#FCF8F2] font-sans focus:outline-none focus:ring-2 focus:ring-[#0E6251]"
                />
              </div>

              <div className="p-3 bg-[#E7F3F0] rounded-xl border border-[#0E6251]/30 text-xs font-mono text-[#09473A]">
                Please bring this item to <strong>[COLLEGE NAME] Central Security Desk Room 104</strong> so it can be physically handed back to its owner.
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFoundThisTarget(null)}
                  disabled={finderSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="teal"
                  isLoading={finderSubmitting}
                  loadingText="Linking item..."
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Confirm &amp; Link Found Item
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
