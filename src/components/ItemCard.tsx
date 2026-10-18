import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ShieldCheck, ArrowRight, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { FoundItem } from '../services/foundItems.ts';
import { LostReport } from '../services/lostReports.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { formatDate } from '../lib/formatters.ts';

export type UnifiedTicket = (FoundItem & { ticket_type?: 'found' }) | (LostReport & { ticket_type?: 'lost' });

export interface ItemCardProps {
  item: FoundItem | LostReport;
  type?: 'found' | 'lost';
  onClaimClick?: (item: FoundItem) => void;
  onFoundThisClick?: (report: LostReport) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  type,
  onClaimClick,
  onFoundThisClick,
}) => {
  const isLost = type === 'lost' || 'last_seen_location' in item;
  const ticketNumber = item.id.replace(/[^0-9]/g, '').padStart(4, '0') || (isLost ? '0819' : '0427');
  const isReturned = !isLost && (item as FoundItem).status === 'returned';

  const title = item.title;
  const category = item.category;
  const description = item.description;
  const imageUrl = item.image_url;
  const location = isLost ? (item as LostReport).last_seen_location : (item as FoundItem).found_location;
  const date = isLost ? (item as LostReport).date_lost : (item as FoundItem).found_date;

  return (
    <div className="relative group pt-5">
      {/* Small Corkboard Pin Touch */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#D94825] shadow-xs border border-[#8C2E16] z-20 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
      </div>

      {/* String Loop Hanging from Punched Eyelet */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-7 pointer-events-none z-10 flex justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Looped Tag String */}
          <path
            d="M12 22C12 13 18 4 15 2C13 0 8 7 12 22Z"
            stroke="#8C6D4F"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Brass Grommet / Eyelet */}
          <circle cx="12" cy="20" r="3.5" fill="#EFE4D3" stroke="#8C6D4F" strokeWidth="1.75" />
        </svg>
      </div>

      {/* Main Tag Body */}
      <div
        className={`tag-card bg-[#FCF8F2] rounded-2xl border-3 shadow-[0_6px_20px_rgba(30,27,24,0.06)] hover:shadow-[0_14px_30px_rgba(30,27,24,0.14)] transition-all duration-200 flex flex-col overflow-hidden relative ${
          isLost ? 'border-[#D94825]' : 'border-[#0E6251]'
        }`}
      >
        {/* Top Punch Hole Reinforcement & Ticket Stub Number */}
        <div
          className={`pt-5 pb-1.5 text-center flex items-center justify-between px-5 border-b-2 border-dashed ${
            isLost ? 'bg-[#FCECE8]/60 border-[#D94825]/30' : 'bg-[#E7F3F0]/60 border-[#0E6251]/30'
          }`}
        >
          <span className="font-mono text-xs font-black text-[#1E1B18] tracking-wider uppercase">
            No. {ticketNumber}
          </span>
          <span className="font-mono text-[10px] font-bold text-[#8C7E70] uppercase">
            [COLLEGE NAME] · {isLost ? 'LOST REPORT' : 'IN CUSTODY'}
          </span>
        </div>

        {/* Photo Container styled with vintage polaroid / photo inset */}
        <div className="relative aspect-16/10 w-full bg-[#EAE0D0] overflow-hidden m-0 border-b-2 border-dashed border-[#DECBB6]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#8C7E70] bg-[#EFE4D3]">
              <span className="text-3xl mb-1">{isLost ? '🔍' : '🏷️'}</span>
              <span className="text-xs font-mono font-bold text-[#8C6D4F]">
                {isLost ? 'Photo pending from owner' : 'No photo logged in manifest'}
              </span>
            </div>
          )}

          {/* Rubber Stamp Badge: LOST or FOUND */}
          <div className="absolute top-3 left-3">
            {isLost ? (
              <StatusBadge status="lost" size="sm" />
            ) : (
              <StatusBadge status={(item as FoundItem).status} size="sm" />
            )}
          </div>

          {!isLost && (item as FoundItem).is_verified && (
            <div
              className="absolute top-3 right-3 bg-[#FCF8F2]/95 backdrop-blur-xs text-[#0E6251] px-2.5 py-0.5 rounded-lg border border-[#0E6251]/30 font-mono text-[10px] font-bold flex items-center gap-1 shadow-xs"
              title="Verified & logged into campus custody"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              OFFICIAL TAG
            </div>
          )}

          {/* Large prominent RETURNED overlay stamp if returned */}
          {isReturned && (
            <div className="absolute inset-0 bg-[#FCF8F2]/75 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 animate-stamp-thump">
              <span className="rubber-stamp stamp-returned text-xl px-4 py-1.5 shadow-md -rotate-6">
                RETURNED
              </span>
              <span className="text-xs font-mono font-black text-[#0E6251] bg-[#FCF8F2] px-2 py-0.5 rounded mt-2 border-2 border-[#0E6251] shadow-xs">
                Item linked to its owner
              </span>
            </div>
          )}
        </div>

        {/* Ticket Details Body */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className={`inline-block text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  isLost
                    ? 'text-[#D94825] bg-[#FCECE8] border-[#D94825]/30'
                    : 'text-[#0E6251] bg-[#E7F3F0] border-[#0E6251]/30'
                }`}
              >
                {category}
              </span>
              <span className="text-[11px] font-mono text-[#8C7E70]">
                {formatDate(date)}
              </span>
            </div>

            {!isLost ? (
              <Link to={`/items/${item.id}`} className="block group-hover:text-[#0E6251] transition-colors">
                <h3 className="text-base sm:text-lg font-display font-black text-[#1E1B18] line-clamp-1 mb-1.5">
                  {title}
                </h3>
              </Link>
            ) : (
              <h3 className="text-base sm:text-lg font-display font-black text-[#1E1B18] line-clamp-1 mb-1.5">
                {title}
              </h3>
            )}

            <p className="text-xs text-[#6B6258] line-clamp-2 mb-4 leading-relaxed font-sans">
              {description}
            </p>
          </div>

          {/* Perforated Stub Section with Monospace details */}
          <div className="pt-3 border-t-2 border-dashed border-[#DECBB6] space-y-2.5 mt-auto">
            <div className="flex items-center gap-1.5 text-xs text-[#6B6258]">
              <MapPin className={`w-3.5 h-3.5 shrink-0 ${isLost ? 'text-[#D94825]' : 'text-[#0E6251]'}`} />
              <span className="font-mono text-[11px] truncate">{location}</span>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#DECBB6]/50">
              {!isLost ? (
                <>
                  <Link
                    to={`/items/${item.id}`}
                    className="text-xs font-mono font-bold text-[#1E1B18] hover:text-[#0E6251] flex items-center gap-1 transition-colors"
                  >
                    Stub Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {(item as FoundItem).status === 'unclaimed' && onClaimClick && (
                    <button
                      type="button"
                      onClick={() => onClaimClick(item as FoundItem)}
                      className="text-xs font-bold font-sans text-white bg-[#0E6251] hover:bg-[#09473A] active:bg-[#07362C] px-3.5 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      This Is Mine
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="text-[11px] font-mono text-[#D94825] font-bold">
                    Lost on Campus
                  </span>

                  {onFoundThisClick && (
                    <button
                      type="button"
                      onClick={() => onFoundThisClick(item as LostReport)}
                      className="text-xs font-bold font-sans text-white bg-[#D94825] hover:bg-[#B33414] active:bg-[#8F270D] px-3.5 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      I Found This!
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
