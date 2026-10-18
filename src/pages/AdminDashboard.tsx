import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Package,
  Inbox,
  Sparkles,
  History,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  Lock,
  ArrowRight,
  RefreshCw,
  Link as LinkIcon,
} from 'lucide-react';
import { foundItemsService, FoundItem, ItemStatusHistoryRecord } from '../services/foundItems.ts';
import { claimsService, Claim } from '../services/claims.ts';
import { lostReportsService, LostReport } from '../services/lostReports.ts';
import { findMatches, MatchResult } from '../lib/matching.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Button } from '../components/Button.tsx';
import { Modal } from '../components/Modal.tsx';
import { Input } from '../components/Input.tsx';
import { Spinner } from '../components/Spinner.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { formatDate, formatDateTime } from '../lib/formatters.ts';
import { ItemStatus, STORAGE_LOCATIONS } from '../lib/constants.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../supabaseClient.ts';

export const AdminDashboard: React.FC = () => {
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'inventory' | 'claims' | 'matchmaker' | 'audit'>('inventory');
  const [items, setItems] = useState<FoundItem[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [lostReports, setLostReports] = useState<LostReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<ItemStatusHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Inventory Filter state
  const [inventorySearch, setInventorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Status Change Modal State
  const [selectedItemForStatus, setSelectedItemForStatus] = useState<FoundItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<ItemStatus>('claimed');
  const [statusStorageBin, setStatusStorageBin] = useState('');
  const [statusAuditReason, setStatusAuditReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Claim Decision Modal State
  const [selectedClaimForReview, setSelectedClaimForReview] = useState<Claim | null>(null);
  const [claimDecision, setClaimDecision] = useState<'approved' | 'rejected'>('approved');
  const [adminNotes, setAdminNotes] = useState('');
  const [pickupDate, setPickupDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [isReviewingClaim, setIsReviewingClaim] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedItems, fetchedClaims, fetchedLost, fetchedAudit] = await Promise.all([
        foundItemsService.getFoundItems(),
        claimsService.getClaims(),
        lostReportsService.getLostReports(),
        foundItemsService.getRecentAuditLogs(50),
      ]);
      setItems(fetchedItems);
      setClaims(fetchedClaims);
      setLostReports(fetchedLost);
      setAuditLogs(fetchedAudit);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen to realtime changes for admin command center
  useEffect(() => {
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      if (typeof supabase.removeChannel === 'function') {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Filtered inventory list
  const filteredInventory = items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (inventorySearch.trim()) {
      const q = inventorySearch.toLowerCase().trim();
      return (
        item.title.toLowerCase().includes(q) ||
        item.found_location.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.storage_location && item.storage_location.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendingClaims = claims.filter((c) => c.status === 'pending');

  // Generate Automated Matches
  const allMatchCandidates = lostReports
    .filter((lr) => lr.status === 'open')
    .map((report) => ({
      report,
      matches: findMatches(
        {
          id: report.id,
          title: report.title,
          category: report.category,
          description: report.description,
          last_seen_location: report.last_seen_location,
          date_lost: report.date_lost,
        },
        items
      ),
    }))
    .filter((m) => m.matches.length > 0);

  // Status Change Submit Handler
  const handleCommitStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForStatus) return;

    if (!statusAuditReason.trim()) {
      alert('A reason is mandatory for campus security audit compliance.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await foundItemsService.updateItemStatus(
        selectedItemForStatus.id,
        targetStatus,
        statusAuditReason,
        profile || user,
        { storage_location: statusStorageBin }
      );
      setSelectedItemForStatus(null);
      setStatusAuditReason('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update item status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Claim Decision Submit Handler
  const handleReviewClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimForReview) return;

    setIsReviewingClaim(true);
    try {
      await claimsService.reviewClaim(
        selectedClaimForReview.id,
        claimDecision,
        adminNotes.trim() || (claimDecision === 'approved' ? 'Ownership evidence verified by campus dispatch.' : 'Insufficient proof of ownership.'),
        profile || user,
        claimDecision === 'approved' ? pickupDate : undefined
      );
      setSelectedClaimForReview(null);
      setAdminNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit claim review');
    } finally {
      setIsReviewingClaim(false);
    }
  };

  // Quick Verify item
  const handleQuickVerify = async (itemId: string) => {
    try {
      await foundItemsService.updateItemStatus(
        itemId,
        'unclaimed',
        `Catalog verified and stamped by security officer ${profile?.full_name}`,
        profile || user,
        { is_verified: true, verified_by: profile?.id }
      );
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to verify item');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'Status', 'Found Location', 'Found Date', 'Storage Bin', 'Verified'];
    const rows = items.map((i) => [
      i.id,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      i.status,
      `"${i.found_location}"`,
      i.found_date,
      `"${i.storage_location || 'Unassigned'}"`,
      i.is_verified ? 'Yes' : 'No',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lost_link_manifest_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Spinner size="xl" />
        <p className="mt-4 text-sm font-mono font-bold text-[#6B6258]">
          Loading [COLLEGE NAME] dispatch console...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dispatch Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#FCF8F2] rounded-3xl border-2 border-[#DECBB6] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258]">
              Total Cataloged Items
            </span>
            <Package className="w-5 h-5 text-[#0E6251]" />
          </div>
          <span className="text-3xl font-display font-black text-[#1E1B18]">{items.length}</span>
          <p className="text-xs font-mono text-[#6B6258] mt-1">
            {items.filter((i) => i.status === 'unclaimed').length} currently unclaimed
          </p>
        </div>

        <div className="bg-[#FCF8F2] rounded-3xl border-2 border-[#D94825]/40 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#D94825]">
              Pending Claims
            </span>
            <Inbox className="w-5 h-5 text-[#D94825]" />
          </div>
          <span className="text-3xl font-display font-black text-[#D94825]">{pendingClaims.length}</span>
          <p className="text-xs font-mono text-[#6B6258] mt-1">Awaiting dispatch verification</p>
        </div>

        <div className="bg-[#FCF8F2] rounded-3xl border-2 border-[#0E6251]/40 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#0E6251]">
              Smart Match Links
            </span>
            <Sparkles className="w-5 h-5 text-[#0E6251]" />
          </div>
          <span className="text-3xl font-display font-black text-[#0E6251]">{allMatchCandidates.length}</span>
          <p className="text-xs font-mono text-[#6B6258] mt-1">Lost tickets matched to inventory</p>
        </div>

        <div className="bg-[#FCF8F2] rounded-3xl border-2 border-[#15803D]/40 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#15803D]">
              Linked &amp; Returned
            </span>
            <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
          </div>
          <span className="text-3xl font-display font-black text-[#15803D]">
            {items.filter((i) => i.status === 'returned').length}
          </span>
          <p className="text-xs font-mono text-[#6B6258] mt-1">Successfully linked to owners</p>
        </div>
      </div>

      {/* Main Console Container */}
      <div className="bg-[#FCF8F2] rounded-3xl border-3 border-[#DECBB6] shadow-sm overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center justify-between px-6 pt-4 border-b-2 border-dashed border-[#DECBB6] bg-[#EFE4D3]/50 gap-4">
          <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`pb-3 text-xs sm:text-sm font-mono font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'inventory'
                  ? 'border-[#0E6251] text-[#0E6251]'
                  : 'border-transparent text-[#6B6258] hover:text-[#1E1B18]'
              }`}
            >
              <Package className="w-4 h-4" />
              Manifest Control ({items.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('claims')}
              className={`pb-3 text-xs sm:text-sm font-mono font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'claims'
                  ? 'border-[#0E6251] text-[#0E6251]'
                  : 'border-transparent text-[#6B6258] hover:text-[#1E1B18]'
              }`}
            >
              <Inbox className="w-4 h-4" />
              Claims Inbox
              {pendingClaims.length > 0 && (
                <span className="bg-[#D94825] text-white font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
                  {pendingClaims.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('matchmaker')}
              className={`pb-3 text-xs sm:text-sm font-mono font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'matchmaker'
                  ? 'border-[#0E6251] text-[#0E6251]'
                  : 'border-transparent text-[#6B6258] hover:text-[#1E1B18]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#0E6251]" />
              Smart Matchmaker ({allMatchCandidates.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`pb-3 text-xs sm:text-sm font-mono font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'audit'
                  ? 'border-[#0E6251] text-[#0E6251]'
                  : 'border-transparent text-[#6B6258] hover:text-[#1E1B18]'
              }`}
            >
              <History className="w-4 h-4" />
              Audit Ledger ({auditLogs.length})
            </button>
          </div>

          <div className="flex items-center gap-2 pb-3">
            <button
              onClick={handleExportCSV}
              className="text-xs font-mono font-bold text-[#1E1B18] bg-[#FCF8F2] border-2 border-[#DECBB6] px-3.5 py-1.5 rounded-xl shadow-2xs hover:bg-[#EFE4D3] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export Manifest
            </button>

            <button
              onClick={loadData}
              className="text-xs font-mono font-bold text-[#1E1B18] bg-[#FCF8F2] border-2 border-[#DECBB6] p-1.5 rounded-xl shadow-2xs hover:bg-[#EFE4D3] transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab 1: INVENTORY MANAGEMENT */}
        {activeTab === 'inventory' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7E70]" />
                <input
                  type="text"
                  placeholder="Filter manifest by title, locker, tag..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-xs font-mono bg-[#FFFDF9] border-2 border-[#DECBB6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E6251]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {['all', 'unclaimed', 'in_review', 'claimed', 'returned', 'archived'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl font-mono font-bold capitalize transition-colors border cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#1E1B18] text-white border-[#1E1B18]'
                        : 'bg-[#EFE4D3] text-[#6B6258] border-[#DECBB6] hover:bg-[#DECBB6]'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-2 border-[#DECBB6] rounded-2xl overflow-hidden overflow-x-auto bg-white">
              <table className="min-w-full divide-y-2 divide-[#DECBB6] text-left text-xs font-mono">
                <thead className="bg-[#EFE4D3] text-[#6B6258] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Claim Ticket Details</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Found Location</th>
                    <th className="px-4 py-3">Storage Safe Bin</th>
                    <th className="px-4 py-3">Stamp Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DECBB6]/50 bg-[#FCF8F2]/70">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-[#EFE4D3]/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-10 h-10 rounded-lg object-cover border border-[#DECBB6] shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#EFE4D3] flex items-center justify-center text-base shrink-0 border border-[#DECBB6]">
                              🏷️
                            </div>
                          )}
                          <div>
                            <Link
                              to={`/items/${item.id}`}
                              className="font-bold text-[#1E1B18] hover:text-[#0E6251] block line-clamp-1"
                            >
                              {item.title}
                            </Link>
                            <span className="text-[10px] text-[#8C7E70]">
                              No. {item.id.replace(/[^0-9]/g, '').padStart(4, '0') || '0427'} · {formatDate(item.found_date)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-[#6B6258]">{item.category}</td>
                      <td className="px-4 py-3.5 text-[#1E1B18] max-w-xs truncate">{item.found_location}</td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#1E1B18] bg-[#EFE4D3] px-2 py-0.5 rounded border border-[#DECBB6]">
                          <Lock className="w-3 h-3 text-[#8C6D4F]" />
                          {item.storage_location || 'Unassigned'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status} size="sm" />
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-2">
                        {!item.is_verified && (
                          <button
                            type="button"
                            onClick={() => handleQuickVerify(item.id)}
                            className="text-[11px] font-bold text-[#0E6251] hover:text-[#09473A] bg-[#E7F3F0] px-2 py-1 rounded border border-[#0E6251]/30 cursor-pointer"
                          >
                            Stamp Tag
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItemForStatus(item);
                            setTargetStatus(item.status);
                            setStatusStorageBin(item.storage_location || STORAGE_LOCATIONS[0]);
                            setStatusAuditReason('');
                          }}
                          className="text-[11px] font-bold text-[#1E1B18] hover:text-white bg-[#EFE4D3] hover:bg-[#1E1B18] px-2.5 py-1 rounded-lg border border-[#DECBB6] transition-colors cursor-pointer"
                        >
                          Change Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: CLAIMS REVIEW INBOX */}
        {activeTab === 'claims' && (
          <div className="p-6 space-y-4">
            {claims.length === 0 ? (
              <EmptyState
                title="Claims Inbox Empty"
                description="No student claims are currently pending dispatch review."
              />
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-5 border-2 border-[#DECBB6] rounded-2xl bg-white space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={claim.status as any} size="sm" />
                          <span className="text-xs text-[#8C7E70] font-mono">Ticket #{claim.id}</span>
                        </div>
                        <h4 className="text-base font-display font-extrabold text-[#1E1B18] mt-1.5">
                          Claimed: {claim.item_title} ({claim.item_category})
                        </h4>
                        <p className="text-xs font-mono text-[#6B6258] mt-0.5">
                          Claimant: <strong>{claim.claimant_name}</strong> (Roll: {claim.claimant_roll} · Email: {claim.claimant_email} · Tel: {claim.contact_phone})
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to={`/items/${claim.item_id}`}>
                          <Button variant="outline" size="sm">
                            Inspect Item
                          </Button>
                        </Link>
                        {claim.status === 'pending' && (
                          <Button
                            variant="teal"
                            size="sm"
                            onClick={() => {
                              setSelectedClaimForReview(claim);
                              setClaimDecision('approved');
                              setAdminNotes('');
                            }}
                          >
                            Review &amp; Render Decision
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#EFE4D3]/50 p-3.5 rounded-xl border border-[#DECBB6] text-xs font-mono text-[#1E1B18] space-y-1">
                      <strong className="block text-[10px] uppercase tracking-wider text-[#8C7E70]">
                        Student Ownership Evidence:
                      </strong>
                      <p className="whitespace-pre-line font-sans">{claim.proof_description}</p>
                    </div>

                    {claim.admin_notes && (
                      <div className="p-3 bg-[#E7F3F0] rounded-xl border border-[#0E6251]/30 text-xs font-mono text-[#09473A]">
                        <strong>Security Notes:</strong> {claim.admin_notes}
                        {claim.pickup_scheduled_at && (
                          <span className="ml-2 font-bold text-[#15803D]">
                            (Scheduled pickup: {formatDate(claim.pickup_scheduled_at)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: SMART MATCHMAKER */}
        {activeTab === 'matchmaker' && (
          <div className="p-6 space-y-6">
            <div className="p-4 bg-[#E7F3F0] rounded-2xl border-2 border-[#0E6251]/30 text-xs font-mono text-[#09473A] flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#0E6251] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-[#0E6251] mb-0.5">
                  Lost-Link Automated Proximity Matchmaker
                </h4>
                <p>
                  Comparing lost item tickets against custody manifest using category tags, description keywords, date window, and campus sector zones.
                </p>
              </div>
            </div>

            {allMatchCandidates.length === 0 ? (
              <EmptyState
                title="No Pending Matches Detected"
                description="All active lost reports have either been matched or do not currently have close candidates in the found items manifest."
              />
            ) : (
              <div className="space-y-6">
                {allMatchCandidates.map(({ report, matches }) => (
                  <div
                    key={report.id}
                    className="p-6 border-2 border-[#DECBB6] rounded-3xl bg-white shadow-2xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-3 border-b-2 border-dashed border-[#DECBB6] gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rubber-stamp stamp-lost text-[10px]">
                            LOST TICKET #{report.id}
                          </span>
                          <span className="font-mono text-xs text-[#8C7E70]">{report.category}</span>
                        </div>
                        <h3 className="text-xl font-display font-black text-[#1E1B18] mt-1">{report.title}</h3>
                        <p className="text-xs font-mono text-[#6B6258]">
                          Last seen at {report.last_seen_location} on {formatDate(report.date_lost)}
                        </p>
                      </div>

                      <span className="font-mono text-xs font-bold text-[#0E6251] bg-[#E7F3F0] px-3 py-1 rounded-xl border border-[#0E6251]/20">
                        {matches.length} Candidate Match{matches.length > 1 ? 'es' : ''}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {matches.map((m) => (
                        <div
                          key={m.item.id}
                          className="p-4 rounded-2xl border-2 border-[#DECBB6] bg-[#FCF8F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3">
                            {m.item.image_url ? (
                              <img
                                src={m.item.image_url}
                                alt={m.item.title}
                                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#DECBB6]"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-[#EFE4D3] flex items-center justify-center text-xl shrink-0 border border-[#DECBB6]">
                                🏷️
                              </div>
                            )}

                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-mono text-[11px] font-black px-2 py-0.5 rounded ${
                                    m.confidence === 'High'
                                      ? 'bg-[#15803D] text-white'
                                      : 'bg-[#0E6251] text-white'
                                  }`}
                                >
                                  {m.score}% MATCH ({m.confidence.toUpperCase()})
                                </span>
                                <StatusBadge status={m.item.status as ItemStatus} size="sm" />
                              </div>
                              <h4 className="text-sm font-display font-black text-[#1E1B18] mt-1">{m.item.title}</h4>
                              <p className="text-xs font-mono text-[#6B6258]">Found: {m.item.found_location}</p>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {m.reasons.map((r, idx) => (
                                  <span key={idx} className="text-[10px] font-mono bg-[#EFE4D3] text-[#6B5035] px-1.5 py-0.5 rounded border border-[#DECBB6]">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Link to={`/items/${m.item.id}`}>
                              <Button variant="outline" size="sm">
                                View Ticket
                              </Button>
                            </Link>
                            <Button
                              variant="teal"
                              size="sm"
                              onClick={() => {
                                setSelectedClaimForReview({
                                  id: `auto-${Date.now()}`,
                                  item_id: m.item.id,
                                  claimant_id: report.user_id,
                                  proof_description: `Automated match linked from lost ticket #${report.id}: "${report.title}"`,
                                  contact_phone: '+1 555-0199',
                                  status: 'pending',
                                  created_at: new Date().toISOString(),
                                  updated_at: new Date().toISOString(),
                                  item_title: m.item.title,
                                });
                                setClaimDecision('approved');
                                setAdminNotes(`Matched via automated similarity engine (${m.score}% confidence).`);
                              }}
                            >
                              Link &amp; Contact Owner
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: AUDIT LEDGER */}
        {activeTab === 'audit' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-[#DECBB6]">
              <div>
                <h3 className="text-base font-display font-black text-[#1E1B18]">
                  [COLLEGE NAME] Custody &amp; Dispatch Register
                </h3>
                <p className="text-xs font-mono text-[#6B6258]">
                  Permanent immutable ledger of every status transition and handover
                </p>
              </div>
            </div>

            <div className="border-2 border-[#DECBB6] rounded-2xl overflow-hidden overflow-x-auto bg-white">
              <table className="min-w-full divide-y-2 divide-[#DECBB6] text-left text-xs font-mono">
                <thead className="bg-[#EFE4D3] text-[#6B6258] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Item Ticket</th>
                    <th className="px-4 py-3">Officer / Signee</th>
                    <th className="px-4 py-3">Status Transition</th>
                    <th className="px-4 py-3">Dispatch Notes / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DECBB6]/50 bg-[#FCF8F2]/70">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#EFE4D3]/40 transition-colors">
                      <td className="px-4 py-3 text-[#8C7E70] whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>

                      <td className="px-4 py-3 text-[#0E6251] font-bold">
                        <Link to={`/items/${log.item_id}`} className="hover:underline">
                          #{log.item_id}
                        </Link>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-bold text-[#1E1B18]">{log.changer_name}</span>
                        <span className="text-[10px] text-[#8C7E70] block uppercase">
                          {log.changer_role}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.old_status ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[#8C7E70]">{log.old_status}</span>
                            <ArrowRight className="w-3 h-3 text-[#D94825]" />
                            <span className="font-bold text-[#0E6251]">{log.new_status}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-[#0E6251]">
                            Created ({log.new_status})
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-[#1E1B18] max-w-sm">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Change Status Modal */}
      {selectedItemForStatus && (
        <Modal
          isOpen={Boolean(selectedItemForStatus)}
          onClose={() => setSelectedItemForStatus(null)}
          title={`Update Status: ${selectedItemForStatus.title}`}
          description="Every status change is permanently audited per [COLLEGE NAME] property policies."
        >
          <form onSubmit={handleCommitStatusChange} className="space-y-4">
            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                Target Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as ItemStatus)}
                className="w-full rounded-xl text-sm font-mono border-2 border-[#DECBB6] py-2.5 px-3 bg-[#FCF8F2] text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#0E6251]"
              >
                <option value="unclaimed">FOUND · UNCLAIMED</option>
                <option value="in_review">IN REVIEW</option>
                <option value="claimed">CLAIM APPROVED (Awaiting Pickup)</option>
                <option value="returned">RETURNED (Item linked to its owner)</option>
                <option value="archived">ARCHIVED</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                Custody Storage Bin
              </label>
              <select
                value={statusStorageBin}
                onChange={(e) => setStatusStorageBin(e.target.value)}
                className="w-full rounded-xl text-sm font-mono border-2 border-[#DECBB6] py-2.5 px-3 bg-[#FCF8F2] text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#0E6251]"
              >
                {STORAGE_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                Audit Reason / Justification <span className="text-[#D94825]">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="State officer notes, verified roll number, or pickup slip..."
                value={statusAuditReason}
                onChange={(e) => setStatusAuditReason(e.target.value)}
                className="w-full rounded-xl text-sm font-mono border-2 border-[#DECBB6] p-3 bg-[#FCF8F2] focus:outline-none focus:ring-2 focus:ring-[#0E6251]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedItemForStatus(null)}
                disabled={isUpdatingStatus}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="teal"
                isLoading={isUpdatingStatus}
                loadingText="Updating..."
              >
                Commit Status to Ledger
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Review Claim Modal */}
      {selectedClaimForReview && (
        <Modal
          isOpen={Boolean(selectedClaimForReview)}
          onClose={() => setSelectedClaimForReview(null)}
          title={`Review Claim: ${selectedClaimForReview.item_title}`}
          description="Evaluate ownership evidence and render an official administrative determination."
        >
          <form onSubmit={handleReviewClaimSubmit} className="space-y-4">
            <div className="p-3.5 bg-[#EFE4D3]/60 rounded-xl border-2 border-dashed border-[#DECBB6] text-xs font-mono space-y-1">
              <p><strong>Claimant:</strong> {selectedClaimForReview.claimant_name} ({selectedClaimForReview.contact_phone})</p>
              <p><strong>Evidence:</strong> {selectedClaimForReview.proof_description}</p>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                Determination Decision
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setClaimDecision('approved')}
                  className={`py-2 px-3 rounded-xl border-2 font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    claimDecision === 'approved'
                      ? 'bg-[#0E6251] text-white border-[#0E6251] shadow-sm'
                      : 'bg-[#FCF8F2] border-[#DECBB6] text-[#1E1B18]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve &amp; Link
                </button>
                <button
                  type="button"
                  onClick={() => setClaimDecision('rejected')}
                  className={`py-2 px-3 rounded-xl border-2 font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    claimDecision === 'rejected'
                      ? 'bg-[#D94825] text-white border-[#D94825] shadow-sm'
                      : 'bg-[#FCF8F2] border-[#DECBB6] text-[#1E1B18]'
                  }`}
                >
                  <XCircle className="w-4 h-4" /> Reject Claim
                </button>
              </div>
            </div>

            {claimDecision === 'approved' && (
              <Input
                label="Scheduled Pickup Date"
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                helperText="Student will be instructed to collect their property by this date"
              />
            )}

            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258] mb-1.5">
                Dispatch Feedback &amp; Verification Remarks
              </label>
              <textarea
                rows={3}
                placeholder={
                  claimDecision === 'approved'
                    ? 'e.g. Serial verified against receipt. Approved for collection at Room 104.'
                    : 'e.g. Serial number provided did not match item in lockbox.'
                }
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full rounded-xl text-sm font-mono border-2 border-[#DECBB6] p-3 bg-[#FCF8F2] focus:outline-none focus:ring-2 focus:ring-[#0E6251]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedClaimForReview(null)}
                disabled={isReviewingClaim}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={claimDecision === 'approved' ? 'teal' : 'orange'}
                isLoading={isReviewingClaim}
                loadingText="Submitting decision..."
              >
                Confirm {claimDecision === 'approved' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
