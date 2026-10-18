import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertCircle,
  FileCheck2,
  PlusCircle,
  MapPin,
  ExternalLink,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { foundItemsService, FoundItem } from '../services/foundItems.ts';
import { lostReportsService, LostReport } from '../services/lostReports.ts';
import { claimsService, Claim } from '../services/claims.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Button } from '../components/Button.tsx';
import { Spinner } from '../components/Spinner.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { formatDate } from '../lib/formatters.ts';

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'claims' | 'lost' | 'found'>('claims');
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [myLostReports, setMyLostReports] = useState<LostReport[]>([]);
  const [myFoundItems, setMyFoundItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;
      try {
        setLoading(true);
        const [claims, lost, found] = await Promise.all([
          claimsService.getClaims({ claimantId: user.id }),
          lostReportsService.getLostReports(user.id),
          foundItemsService.getFoundItems({ reportedBy: user.id }),
        ]);
        setMyClaims(claims);
        setMyLostReports(lost);
        setMyFoundItems(found);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-sm font-mono font-bold text-[#6B6258]">
          Opening your ticket envelope...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Student Ticket Holder Envelope Header */}
      <div className="bg-[#FCF8F2] rounded-3xl border-3 border-[#DECBB6] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#EFE4D3] border-2 border-[#8C6D4F] text-[#8C6D4F] flex items-center justify-center font-display font-black text-2xl shadow-inner">
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-display font-black text-[#1E1B18] tracking-tight">
                {profile?.full_name || 'Campus Student'}
              </h1>
              <span className="rubber-stamp stamp-found text-[10px]">
                {profile?.role || 'student'}
              </span>
            </div>
            <p className="text-xs text-[#6B6258] mt-1 font-mono">
              Roll No: <strong className="text-[#1E1B18]">{profile?.roll_number}</strong> · College Email: <strong className="text-[#1E1B18]">{profile?.college_email}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link to="/report-lost" className="flex-1 sm:flex-none">
            <Button variant="danger" size="sm" leftIcon={<AlertCircle className="w-4 h-4 text-white" />}>
              Link Lost Item
            </Button>
          </Link>
          <Link to="/report-found" className="flex-1 sm:flex-none">
            <Button variant="teal" size="sm" leftIcon={<PlusCircle className="w-4 h-4 text-white" />}>
              Link Found Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Ticket Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          onClick={() => setActiveTab('claims')}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
            activeTab === 'claims'
              ? 'bg-[#FCF8F2] border-[#0E6251] shadow-md -translate-y-1'
              : 'bg-[#FCF8F2]/70 border-[#DECBB6] hover:border-[#8C6D4F]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#6B6258]">
              My Claim Tickets
            </span>
            <FileCheck2 className="w-5 h-5 text-[#0E6251]" />
          </div>
          <span className="text-3xl font-display font-black text-[#1E1B18]">{myClaims.length}</span>
          <p className="text-xs font-mono text-[#6B6258] mt-1">
            {myClaims.filter((c) => c.status === 'pending').length} pending dispatch verification
          </p>
        </div>

        <div
          onClick={() => setActiveTab('lost')}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
            activeTab === 'lost'
              ? 'bg-[#FCF8F2] border-[#D94825] shadow-md -translate-y-1'
              : 'bg-[#FCF8F2]/70 border-[#DECBB6] hover:border-[#8C6D4F]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#D94825]">
              My Lost Tickets
            </span>
            <AlertCircle className="w-5 h-5 text-[#D94825]" />
          </div>
          <span className="text-3xl font-display font-black text-[#D94825]">{myLostReports.length}</span>
          <p className="text-xs font-mono text-[#6B6258] mt-1">
            {myLostReports.filter((r) => r.status === 'open').length} active search tickets
          </p>
        </div>

        <div
          onClick={() => setActiveTab('found')}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
            activeTab === 'found'
              ? 'bg-[#FCF8F2] border-[#0E6251] shadow-md -translate-y-1'
              : 'bg-[#FCF8F2]/70 border-[#DECBB6] hover:border-[#8C6D4F]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#0E6251]">
              Items I Turned In
            </span>
            <Package className="w-5 h-5 text-[#0E6251]" />
          </div>
          <span className="text-3xl font-display font-black text-[#0E6251]">{myFoundItems.length}</span>
          <p className="text-xs font-mono text-[#6B6258] mt-1">Turned over to campus dispatch</p>
        </div>
      </div>

      {/* Tabs View */}
      <div className="bg-[#FCF8F2] rounded-3xl border-2 border-[#DECBB6] overflow-hidden shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex border-b-2 border-dashed border-[#DECBB6] px-6 pt-4 gap-6 bg-[#EFE4D3]/50 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('claims')}
            className={`pb-3 text-xs sm:text-sm font-mono font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'claims'
                ? 'border-[#0E6251] text-[#0E6251]'
                : 'border-transparent text-[#6B6258] hover:text-[#1E1B18]'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            Claim Requests ({myClaims.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lost')}
            className={`pb-3 text-xs sm:text-sm font-mono font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'lost'
                ? 'border-[#D94825] text-[#D94825]'
                : 'border-transparent text-[#6B6258] hover:text-[#1E1B18]'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-[#D94825]" />
            Lost Tickets ({myLostReports.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('found')}
            className={`pb-3 text-xs sm:text-sm font-mono font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'found'
                ? 'border-[#0E6251] text-[#0E6251]'
                : 'border-transparent text-[#6B6258] hover:text-[#1E1B18]'
            }`}
          >
            <Package className="w-4 h-4" />
            Items Turned In ({myFoundItems.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8">
          {activeTab === 'claims' && (
            <div className="space-y-4">
              {myClaims.length === 0 ? (
                <EmptyState
                  title="No Claims in Your Envelope"
                  description="When you spot an item on the claim board that belongs to you, click 'Link My Claim' to file ownership evidence."
                  action={
                    <Link to="/items">
                      <Button variant="teal" size="sm">
                        Search Claim Board
                      </Button>
                    </Link>
                  }
                />
              ) : (
                myClaims.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 border-2 border-[#DECBB6] rounded-2xl bg-white hover:border-[#0E6251] transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={c.status as any} size="sm" />
                          <span className="font-mono text-xs text-[#8C7E70]">Ticket #{c.id}</span>
                        </div>
                        <h4 className="text-base font-display font-extrabold text-[#1E1B18] mt-1.5">
                          {c.item_title}
                        </h4>
                      </div>

                      <Link to={`/items/${c.item_id}`}>
                        <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                          View Full Ticket
                        </Button>
                      </Link>
                    </div>

                    <div className="bg-[#EFE4D3]/50 p-3.5 rounded-xl border border-[#DECBB6] text-xs font-mono text-[#1E1B18]">
                      <strong>Submitted Proof Evidence:</strong> {c.proof_description}
                    </div>

                    {c.admin_notes && (
                      <div className="bg-[#E7F3F0] p-3.5 rounded-xl border border-[#0E6251]/30 text-xs font-mono text-[#09473A]">
                        <strong>Campus Dispatch Feedback:</strong> {c.admin_notes}
                        {c.pickup_scheduled_at && (
                          <div className="mt-1 font-bold text-[#15803D]">
                            Pickup Scheduled: {formatDate(c.pickup_scheduled_at)} at Security Desk Room 104.
                          </div>
                        )}
                      </div>
                    )}

                    <div className="font-mono text-[11px] text-[#8C7E70] flex items-center justify-between pt-1">
                      <span>Submitted: {formatDate(c.created_at)}</span>
                      <span>Contact Tel: {c.contact_phone}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'lost' && (
            <div className="space-y-4">
              {myLostReports.length === 0 ? (
                <EmptyState
                  title="No Lost Tickets Filed"
                  description="Misplaced something on campus? File a ticket so our automated similarity engine can link it when found."
                  action={
                    <Link to="/report-lost">
                      <Button variant="danger" size="sm">
                        File a Lost Ticket
                      </Button>
                    </Link>
                  }
                />
              ) : (
                myLostReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-5 border-2 border-[#D94825]/30 rounded-2xl bg-white space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#D94825] bg-[#FCECE8] px-2 py-0.5 rounded border border-[#D94825]/30">
                            {report.category}
                          </span>
                          <span className="rubber-stamp stamp-lost text-[10px]">
                            {report.status}
                          </span>
                        </div>
                        <h4 className="text-base font-display font-extrabold text-[#1E1B18] mt-1.5">{report.title}</h4>
                      </div>

                      <span className="font-mono text-xs text-[#8C7E70]">
                        Filed on {formatDate(report.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-[#6B6258] font-sans leading-relaxed">{report.description}</p>

                    <div className="flex items-center gap-4 text-xs font-mono text-[#6B6258] pt-1 border-t border-[#DECBB6]/50">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#D94825]" />
                        Last seen: {report.last_seen_location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#0E6251]" />
                        Date: {formatDate(report.date_lost)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'found' && (
            <div className="space-y-4">
              {myFoundItems.length === 0 ? (
                <EmptyState
                  title="No Found Items Turned In"
                  description="Help your fellow students! If you spot an unattended item on campus, log it and bring it to dispatch."
                  action={
                    <Link to="/report-found">
                      <Button variant="teal" size="sm">
                        Link a Found Item
                      </Button>
                    </Link>
                  }
                />
              ) : (
                myFoundItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 border-2 border-[#DECBB6] rounded-2xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border-2 border-[#DECBB6]"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-[#EFE4D3] flex items-center justify-center text-xl shrink-0">
                          📦
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={item.status} size="sm" />
                          <span className="font-mono text-xs text-[#8C7E70]">{item.category}</span>
                        </div>
                        <h4 className="text-base font-display font-black text-[#1E1B18] mt-1">{item.title}</h4>
                        <p className="text-xs font-mono text-[#6B6258] mt-0.5">Found at {item.found_location}</p>
                      </div>
                    </div>

                    <Link to={`/items/${item.id}`}>
                      <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                        Inspect Ticket
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
