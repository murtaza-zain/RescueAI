import { MapPin, Clock, CheckCircle2, XCircle, Navigation } from 'lucide-react';
import type { Responder, CandidateResponse } from '@/types/rescue';
import { CAPABILITY_LABELS } from '@/types/rescue';

interface ResponderCardProps {
  responder: Responder;
  candidate?: CandidateResponse;
  recommendation?: {
    etaMinutes: number;
    distanceKm: number;
    capabilityMatch: number;
    score: number;
    reasoning: string;
  };
  onClick?: () => void;
  selected?: boolean;
}

const compatibilityBadge: Record<string, { label: string; class: string }> = {
  compatible: { label: 'Compatible', class: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  partial: { label: 'Partial', class: 'bg-amber-50 text-amber-600 border-amber-200' },
  incompatible: { label: 'Incompatible', class: 'bg-red-50 text-red-600 border-red-200' },
};

export function ResponderCard({
  responder,
  candidate,
  recommendation,
  onClick,
  selected = false,
}: ResponderCardProps) {
  const etaMinutes = candidate?.durationMinutes ?? recommendation?.etaMinutes ?? responder.currentEtaMinutes;
  const distanceKm = candidate?.distanceKm ?? recommendation?.distanceKm ?? 0;
  const sourceLabel = candidate?.source === 'goong' ? 'Goong route estimate' : 'Demo route estimate';
  const compat = candidate ? compatibilityBadge[candidate.compatibility] : null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
        selected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${responder.available ? 'bg-emerald-50' : 'bg-gray-100'}`}>
            {responder.available ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-gray-400" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{responder.name}</p>
            <p className="text-xs text-gray-400">{responder.id}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${responder.available ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
            {responder.status}
          </span>
          {compat && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${compat.class}`}>
              {compat.label}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2.5">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />
          <span>{responder.serviceArea}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          <span>{etaMinutes} min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Navigation className="h-3.5 w-3.5 text-gray-400" />
          <span>{distanceKm} km</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {responder.capabilities.map((cap) => {
          const isMatched = candidate?.matchedCapabilities.includes(cap);
          const isMissing = candidate?.missingCapabilities.includes(cap);
          return (
            <span
              key={cap}
              className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                isMatched ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : isMissing ? 'bg-red-50 border-red-200 text-red-500'
                  : 'bg-gray-50 border-gray-100 text-gray-600'
              }`}
            >
              {CAPABILITY_LABELS[cap]}
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {responder.supportedVehicleTypes.map((v) => (
          <span key={v} className="rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600">
            {v}
          </span>
        ))}
      </div>

      <div className="mt-2.5 pt-2.5 border-t border-gray-100">
        <p className="text-[10px] text-gray-400">{sourceLabel}</p>
      </div>

      {recommendation && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500">Match Score</span>
            <span className="text-sm font-bold text-gray-900">{(recommendation.score * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-2">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500" style={{ width: `${recommendation.score * 100}%` }} />
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{recommendation.reasoning}</p>
        </div>
      )}
    </button>
  );
}
