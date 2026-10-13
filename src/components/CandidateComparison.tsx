import { XCircle } from 'lucide-react';
import type { CandidateResponse } from '@/types/rescue';

interface CandidateComparisonProps {
  candidates: CandidateResponse[];
  recommendedId: string | null;
}

export function CandidateComparison({ candidates, recommendedId }: CandidateComparisonProps) {
  const eligible = candidates.filter((c) => c.eligibility === 'eligible');
  const ineligible = candidates.filter((c) => c.eligibility === 'ineligible');

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-900 mb-3">Candidate Comparison</p>

      {eligible.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">No eligible responders available.</p>
      ) : (
        <div className="space-y-1.5 mb-4">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 text-[10px] font-medium uppercase tracking-wider text-gray-400 px-2 pb-1">
            <div className="col-span-4">Responder</div>
            <div className="col-span-2 text-center">Capability</div>
            <div className="col-span-2 text-center">ETA</div>
            <div className="col-span-2 text-center">Distance</div>
            <div className="col-span-2 text-center">Score</div>
          </div>
          {eligible.map((c) => (
            <div
              key={c.responder.id}
              className={`grid grid-cols-12 gap-2 items-center rounded-lg px-2 py-2 text-xs ${
                recommendedId === c.responder.id ? 'bg-blue-50 border border-blue-200' : ''
              }`}
            >
              <div className="col-span-4 font-medium text-gray-900 truncate">
                {c.responder.name}
                {recommendedId === c.responder.id && (
                  <span className="ml-1.5 text-[9px] font-bold text-blue-600">RECOMMENDED</span>
                )}
              </div>
              <div className="col-span-2 text-center text-gray-600">
                {c.matchedCapabilities.length}/{c.matchedCapabilities.length + c.missingCapabilities.length}
              </div>
              <div className="col-span-2 text-center text-gray-600">{c.durationMinutes} min</div>
              <div className="col-span-2 text-center text-gray-600">{c.distanceKm} km</div>
              <div className="col-span-2 text-center font-bold text-gray-900">{c.score}</div>
            </div>
          ))}
        </div>
      )}

      {ineligible.length > 0 && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-2">Not Eligible</p>
          <div className="space-y-1.5">
            {ineligible.map((c) => (
              <div key={c.responder.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-2">
                <XCircle className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="text-xs font-medium text-gray-500">{c.responder.name}</span>
                <span className="text-[10px] text-gray-400 truncate ml-auto">{c.eligibilityReason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
