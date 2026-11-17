import React from 'react';
import { RotateCcw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasData }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand mark & single-line wordmark */}
        <a
          href="#summary"
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg py-1"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="32" height="32" rx="8" fill="#1D4ED8" />
            <path
              d="M9 10.5C9 9.67157 9.67157 9 10.5 9H21.5C22.3284 9 23 9.67157 23 10.5V21.5C23 22.3284 22.3284 23 21.5 23H10.5C9.67157 23 9 22.3284 9 21.5V10.5Z"
              stroke="white"
              strokeWidth="1.75"
            />
            <path
              d="M13 19.5V12.5L19 19.5V12.5"
              stroke="white"
              strokeWidth="1.85"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11.5 15.25H20.5M11.5 17.25H20.5"
              stroke="#93C5FD"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900">
            SmartLedger
          </span>
        </a>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#summary"
            className="hover:text-blue-700 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Summary
          </a>
          <a
            href="#calculator"
            className="hover:text-blue-700 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Calculator
          </a>
          <a
            href="#sales"
            className="hover:text-blue-700 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Sales
          </a>
          <a
            href="#how-it-works"
            className="hover:text-blue-700 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            How It Works
          </a>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onReset}
            disabled={!hasData}
            className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-700 hover:border-blue-200 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
