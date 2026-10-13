import { Navigation, Clock, Route as RouteIcon, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import type { GoongRouteResult, Responder } from '@/types/rescue';

interface RouteCardProps {
  responder: Responder | null;
  routeResult: GoongRouteResult | null;
  loading: boolean;
  rescueScore?: number;
  isRecommended?: boolean;
}

export function RouteCard({ responder, routeResult, loading, rescueScore, isRecommended }: RouteCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-blue-600">Loading rescue route…</p>
        </div>
        <p className="text-xs text-blue-400">Calculating directions from responder to incident</p>
      </div>
    );
  }

  if (!routeResult || !responder) return null;

  const metrics = routeResult.metrics;
  const isGoong = routeResult.source === 'goong';

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${isGoong ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <RouteIcon className={`h-4 w-4 ${isGoong ? 'text-blue-500' : 'text-gray-400'}`} />
          <p className="text-sm font-semibold text-gray-900">
            {isRecommended ? 'Recommended Route' : 'Rescue Route'}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${isGoong ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
          {isGoong ? 'Route calculated by Goong' : 'Demo route estimate'}
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        {responder.name} → Incident
      </p>

      {metrics && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-xl bg-white border border-gray-100 p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <Clock className="h-3 w-3" />
              <span>Travel time</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{metrics.durationText}</p>
          </div>
          <div className="rounded-xl bg-white border border-gray-100 p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <Navigation className="h-3 w-3" />
              <span>Distance</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{metrics.distanceText}</p>
          </div>
        </div>
      )}

      {rescueScore !== undefined && (
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-gray-700" />
          <span className="text-xs font-medium text-gray-500">Rescue Score</span>
          <span className="text-sm font-bold text-gray-900">{rescueScore}</span>
        </div>
      )}

      {routeResult.warnings.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 mb-2">
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              {routeResult.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-600">{w}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {routeResult.status === 'fallback' && (
        <p className="text-[10px] text-gray-400">
          Route directions unavailable — showing estimated metrics
        </p>
      )}
    </div>
  );
}
