import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, XCircle, CheckCircle2, Clock } from 'lucide-react';
import type { CandidateResponse } from '@/types/rescue';
import { CAPABILITY_LABELS } from '@/types/rescue';

interface WhyNotClosestProps {
  candidates: CandidateResponse[];
  recommended: CandidateResponse | null;
}

export function WhyNotClosest({ candidates, recommended }: WhyNotClosestProps) {
  const [expanded, setExpanded] = useState(true);

  const eligible = candidates.filter((c) => c.eligibility === 'eligible');
  if (eligible.length === 0 || !recommended) return null;

  const sorted = [...eligible].sort((a, b) => a.durationMinutes - b.durationMinutes);
  const closest = sorted[0];

  if (closest.responder.id === recommended.responder.id) return null;

  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-gray-700" />
          <span className="text-sm font-bold text-gray-900">Why not the closest?</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Closest but not eligible */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Closest</span>
            </div>
            <p className="text-sm font-bold text-gray-700">{closest.responder.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{closest.durationMinutes} min</p>
            <div className="mt-2 flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-xs font-medium text-red-500">Not eligible</span>
            </div>
            {closest.missingCapabilities.length > 0 && (
              <div className="mt-1.5">
                <p className="text-[10px] text-gray-400">Missing:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {closest.missingCapabilities.map((c) => (
                    <span key={c} className="rounded-md bg-red-50 border border-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-500">
                      {CAPABILITY_LABELS[c] || c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommended */}
          <div className="rounded-xl border-2 border-gray-900 bg-gray-900 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Recommended</span>
            </div>
            <p className="text-sm font-bold text-white">{recommended.responder.name}</p>
            <p className="text-xs text-gray-300 mt-0.5">{recommended.durationMinutes} min</p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-2xl font-bold text-white">{recommended.score}</span>
              <span className="text-sm text-gray-400">/ 100</span>
            </div>
            <p className="text-[10px] text-gray-300 mt-1">All required capabilities</p>
          </div>
        </div>
      )}
    </div>
  );
}
