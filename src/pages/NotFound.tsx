import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '../components/Button.tsx';
import { LostLinkLogoMark } from '../components/Logo.tsx';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto bg-[#FCF8F2] rounded-3xl border-3 border-[#DECBB6] shadow-sm my-8">
      <div className="mb-4">
        <LostLinkLogoMark size={56} />
      </div>
      <span className="rubber-stamp stamp-lost text-xs mb-2">
        TICKET VOID · 404
      </span>
      <h1 className="text-3xl font-display font-black text-[#1E1B18] tracking-tight mb-2">
        Ticket Lost on Campus
      </h1>
      <p className="text-xs sm:text-sm font-mono text-[#6B6258] mb-8 leading-relaxed">
        The claim ticket or registry page you requested cannot be found in the [COLLEGE NAME] dispatch system.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
        <Link to="/items">
          <Button variant="teal" leftIcon={<Search className="w-4 h-4" />}>
            Search Claim Board
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            My Ticket Envelope
          </Button>
        </Link>
      </div>
    </div>
  );
};
