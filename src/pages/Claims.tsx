import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Link as LinkIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { claimsService, Claim } from '../services/claims.ts';
import { Button } from '../components/Button.tsx';
import { Spinner } from '../components/Spinner.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { formatDate, formatDateTime } from '../lib/formatters.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';

export const Claims: React.FC = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    async function loadClaims() {
      if (!user) return;
      try {
        setLoading(true);
        const data = await claimsService.getClaims({ claimantId: user.id });
        setClaims(data);
      } catch (err) {
        console.error('Error fetching claims:', err);
      } finally {
        setLoading(false);
      }
    }
    loadClaims();
  }, [user]);

  const filtered = claims.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rubber-stamp stamp-found text-xs mb-2">
            <FileCheck2 className="w-3.5 h-3.5" />
            OWNERSHIP CLAIM TICKETS
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-[#1E1B18] tracking-tight">
            My Claim Tickets
          </h1>
          <p className="text-xs text-[#6B6258] mt-1 font-mono">
            Track claims filed for found campus property, dispatch decisions, and pickup passes
          </p>
        </div>

        <Link to="/items">
          <Button variant="teal" size="sm">
            Browse More Claim Tickets
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b-2 border-dashed border-[#DECBB6] pb-3 overflow-x-auto">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold uppercase transition-colors cursor-pointer border ${
              filter === st
                ? 'bg-[#1E1B18] text-white border-[#1E1B18]'
                : 'bg-[#FCF8F2] text-[#6B6258] border-[#DECBB6] hover:bg-[#EFE4D3]'
            }`}
          >
            {st} ({st === 'all' ? claims.length : claims.filter((c) => c.status === st).length})
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm font-mono font-bold text-[#6B6258]">
            Checking ticket registry...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Claim Tickets in Registry"
          description={
            filter === 'all'
              ? "You haven't filed any ownership claims yet. Browse the campus claim board if you misplaced an item."
              : `No claims currently categorized as '${filter}'.`
          }
          action={
            <Link to="/items">
              <Button variant="teal" size="sm">
                Explore Claim Board
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {filtered.map((claim) => (
            <div
              key={claim.id}
              className="bg-[#FCF8F2] rounded-3xl border-2 border-[#DECBB6] p-6 shadow-xs space-y-4 relative"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {claim.item_image_url ? (
                    <img
                      src={claim.item_image_url}
                      alt={claim.item_title}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-[#DECBB6] shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-[#EFE4D3] text-[#8C7E70] flex items-center justify-center text-3xl shrink-0 border border-[#DECBB6]">
                      🏷️
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={claim.status as any} size="sm" />
                      <span className="font-mono text-xs text-[#8C7E70]">Ticket #{claim.id}</span>
                    </div>

                    <h3 className="text-lg font-display font-black text-[#1E1B18]">{claim.item_title}</h3>
                    <p className="font-mono text-xs text-[#8C7E70] mt-0.5">{claim.item_category}</p>
                  </div>
                </div>

                <Link to={`/items/${claim.item_id}`}>
                  <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                    View Ticket Record
                  </Button>
                </Link>
              </div>

              {/* Submitted Proof */}
              <div className="p-3.5 bg-[#EFE4D3]/60 rounded-2xl border-2 border-dashed border-[#DECBB6] text-xs font-mono text-[#1E1B18] space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C7E70] block">
                  Your Evidence Submitted
                </span>
                <p className="whitespace-pre-line font-sans">{claim.proof_description}</p>
                {claim.proof_image_url && (
                  <div className="pt-2">
                    <a
                      href={claim.proof_image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0E6251] hover:underline font-bold inline-flex items-center gap-1"
                    >
                      View Attached Evidence Photo &rarr;
                    </a>
                  </div>
                )}
              </div>

              {/* Dispatch Feedback Box */}
              {claim.admin_notes && (
                <div
                  className={`p-4 rounded-2xl border-2 text-xs font-mono space-y-2 ${
                    claim.status === 'approved'
                      ? 'bg-[#EAF5E9] border-[#15803D]/40 text-[#14532D]'
                      : claim.status === 'rejected'
                      ? 'bg-[#FCECE8] border-[#D94825]/40 text-[#A93315]'
                      : 'bg-[#FEF3C7] border-[#D97706]/40 text-[#92400E]'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    {claim.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-[#15803D]" />}
                    {claim.status === 'rejected' && <XCircle className="w-4 h-4 text-[#D94825]" />}
                    {claim.status === 'pending' && <Clock className="w-4 h-4 text-[#D97706]" />}
                    <span>[COLLEGE NAME] Dispatch Decision &amp; Instructions</span>
                  </div>

                  <p className="leading-relaxed font-sans">{claim.admin_notes}</p>

                  {claim.status === 'approved' && (
                    <div className="mt-2 pt-2 border-t border-[#15803D]/30 font-mono text-[11px]">
                      <strong>Pickup Station:</strong> Central Security Desk (Room 104, [COLLEGE NAME]).
                      <br />
                      <strong>ID Requirement:</strong> Bring your student ID card to sign the return register.
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#8C7E70] pt-1 border-t border-[#DECBB6]/40">
                <span>Filed: {formatDateTime(claim.created_at)}</span>
                <span>Contact: {claim.contact_phone}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
