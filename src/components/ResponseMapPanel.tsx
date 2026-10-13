import { MapIcon, Navigation, CheckCircle2, XCircle } from 'lucide-react';

interface ResponseMapPanelProps {
  recommendedCount: number;
  eligibleCount: number;
  ineligibleCount: number;
  hasSelection: boolean;
}

export function ResponseMapPanel({ recommendedCount, eligibleCount, ineligibleCount, hasSelection }: ResponseMapPanelProps) {
  return (
    <div className="absolute top-4 right-4 z-10 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm px-3.5 py-3">
      <div className="flex items-center gap-1.5 mb-2">
        <MapIcon className="h-3.5 w-3.5 text-gray-500" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Response Map</p>
      </div>
      <div className="space-y-1">
        {recommendedCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-700">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-900 ring-2 ring-gray-300" />
            {recommendedCount} recommended
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-gray-700">
          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
          {eligibleCount} eligible alternative{eligibleCount !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <XCircle className="h-2.5 w-2.5 text-gray-300" />
          {ineligibleCount} ineligible
        </div>
      </div>
      {hasSelection && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-[10px] text-blue-500">
          <Navigation className="h-2.5 w-2.5" />
          Route active
        </div>
      )}
    </div>
  );
}
