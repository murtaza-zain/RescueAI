import { CheckCircle2, Clock, Navigation, Sparkles, Cpu } from 'lucide-react';
import type { CandidateResponse } from '@/types/rescue';
import { CAPABILITY_LABELS } from '@/types/rescue';

interface RescueScoreCardProps {
  candidate: CandidateResponse;
  decisionReason: string;
}

function ScoreBar({ label, value, max, weight, color }: { label: string; value: number; max: number; weight: string; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className="text-xs font-bold text-gray-900">{value} <span className="text-gray-400 font-normal">/ {max} ({weight})</span></span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function RescueScoreCard({ candidate, decisionReason }: RescueScoreCardProps) {
  const b = candidate.breakdown;

  return (
    <div className="rounded-2xl border border-gray-900 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Recommended Response</p>
            <p className="text-sm font-bold text-gray-900">{candidate.responder.name}</p>
          </div>
        </div>
      </div>

      {/* Score display */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-5xl font-bold text-gray-900">{b.totalScore}</span>
        <span className="text-xl text-gray-400">/ 100</span>
      </div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-4">Rescue Score</p>

      {/* Breakdown */}
      <div className="space-y-3 mb-4">
        <ScoreBar label="Capability Fit" value={b.capabilityFit} max={100} weight="50%" color="bg-blue-500" />
        <ScoreBar label="Response Time" value={b.responseTime} max={100} weight="35%" color="bg-emerald-500" />
        <ScoreBar label="Availability" value={b.availability} max={100} weight="15%" color="bg-amber-500" />
      </div>

      {/* Reason */}
      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-2">Why this responder?</p>
        <p className="text-xs text-gray-600 leading-relaxed mb-3">{decisionReason}</p>

        <div className="space-y-1.5">
          {candidate.matchedCapabilities.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>All required capabilities: {candidate.matchedCapabilities.map((c) => CAPABILITY_LABELS[c] || c).join(', ')}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Available now</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{candidate.durationMinutes} min estimated response</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
            <Navigation className="h-3.5 w-3.5 shrink-0" />
            <span>{candidate.distanceKm} km route distance</span>
          </div>
        </div>
      </div>

      {/* Deterministic badge */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5">
        <Cpu className="h-3 w-3 text-gray-400" />
        <span className="text-[10px] text-gray-400">Deterministic RescueAI decision</span>
      </div>
    </div>
  );
}
