import { useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, TrendingUp, Activity, Navigation,
  Sparkles, Radio, Users, Map as MapIcon, Filter,
} from 'lucide-react';
import { rescueData, buildCandidateResponses } from '@/services/rescueData';
import { generateRescueDecision } from '@/services/rescueDecisionEngine';
import { demoResponders } from '@/data/demoResponders';
import { demoServiceCentres } from '@/data/demoServiceCentres';
import { MapView } from './MapView';
import type { CandidateResponse } from '@/types/rescue';

interface OperationsPanelProps {
  onIncidentClick?: (incidentId: string) => void;
}

type MapFilter = 'all' | 'incidents' | 'responders' | 'centres';

function StatCard({
  icon, label, value, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export function OperationsPanel({ onIncidentClick }: OperationsPanelProps) {
  const [showMap, setShowMap] = useState(false);
  const [mapFilter, setMapFilter] = useState<MapFilter>('all');

  const activeIncidents = rescueData.getActiveIncidents();
  const availableUnits = rescueData.getAvailableUnits();
  const busyUnits = demoResponders.filter((r) => r.status === 'busy');
  const offlineUnits = demoResponders.filter((r) => r.status === 'offline');
  const highPriority = rescueData.getHighPriorityIncidents();
  const breakdown = rescueData.getIncidentTypeBreakdown();
  const maxCount = Math.max(...Object.values(breakdown), 1);

  const incidentRecs = activeIncidents.map((inc) => {
    const candidates = buildCandidateResponses(inc, null, demoResponders, null, 'fallback');
    const decision = generateRescueDecision(inc, null, candidates, 'fallback', 'fallback');
    return { incident: inc, decision, candidates };
  });

  const eligibleCount = incidentRecs.reduce((sum, ir) => {
    return sum + ir.decision.candidates.filter((c: CandidateResponse) => c.eligibility === 'eligible').length;
  }, 0);

  const avgScore = incidentRecs.length > 0
    ? Math.round(incidentRecs.reduce((sum, ir) => sum + ir.decision.score, 0) / incidentRecs.length)
    : 0;

  // Avg eligible ETA across all incidents
  const allEligibleETAs: number[] = [];
  for (const ir of incidentRecs) {
    for (const c of ir.candidates) {
      if (c.eligibility === 'eligible') allEligibleETAs.push(c.durationMinutes);
    }
  }
  const avgEligibleEta = allEligibleETAs.length > 0
    ? Math.round(allEligibleETAs.reduce((a, b) => a + b, 0) / allEligibleETAs.length)
    : 0;

  // Map filter logic
  const mapResponders = mapFilter === 'incidents' || mapFilter === 'centres' ? [] : demoResponders;
  const mapIncidents = mapFilter === 'responders' || mapFilter === 'centres' ? undefined : activeIncidents[0] ?? null;
  const mapCentres = mapFilter === 'incidents' || mapFilter === 'responders' ? [] : demoServiceCentres;

  return (
    <div className="space-y-5">
      {/* Mission Control header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Mission Control</h2>
        </div>
        <button
          onClick={() => setShowMap(!showMap)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50"
        >
          <MapIcon className="h-3.5 w-3.5" />
          {showMap ? 'Hide Map' : 'Response Network'}
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<AlertTriangle className="h-4 w-4 text-orange-500" />} label="Active Incidents" value={activeIncidents.length} accent="bg-orange-50" />
        <StatCard icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} label="Eligible Responders" value={eligibleCount} accent="bg-emerald-50" />
        <StatCard icon={<Clock className="h-4 w-4 text-blue-500" />} label="Avg Eligible ETA" value={`${avgEligibleEta} min`} accent="bg-blue-50" />
        <StatCard icon={<TrendingUp className="h-4 w-4 text-red-500" />} label="High Priority" value={highPriority.length} accent="bg-red-50" />
      </div>

      {/* Response Network Map */}
      {showMap && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapIcon className="h-4 w-4 text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-900">Response Network</h3>
            </div>
            <div className="flex items-center gap-1">
              {(['all', 'incidents', 'responders', 'centres'] as MapFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setMapFilter(f)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                    mapFilter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {f === 'centres' ? 'Service Centres' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[400px]">
            <MapView
              incident={mapIncidents}
              responders={mapResponders}
              serviceCentres={mapCentres}
            />
          </div>
        </div>
      )}

      {/* Recommended responses */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-gray-700" />
          <h3 className="text-sm font-semibold text-gray-900">Active Incidents</h3>
        </div>
        {incidentRecs.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No active incidents</p>
        ) : (
          <div className="space-y-2">
            {incidentRecs.map(({ incident: inc, decision: dec, candidates: cands }) => {
              const recommendedCandidate = dec.recommendedResponderId
                ? cands.find((c) => c.responder.id === dec.recommendedResponderId)
                : null;
              return (
                <button
                  key={inc.id}
                  onClick={() => onIncidentClick?.(inc.id)}
                  className="w-full text-left flex items-center justify-between rounded-xl border border-gray-100 p-3 transition-all hover:border-gray-200 hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{inc.problemType}</p>
                    <p className="text-xs text-gray-400 truncate">{inc.location}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${inc.priority === 'Critical' ? 'bg-red-50 text-red-600' : inc.priority === 'High' ? 'bg-orange-50 text-orange-600' : inc.priority === 'Medium' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                      {inc.priority}
                    </span>
                    {dec.recommendedResponder && recommendedCandidate ? (
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-700">{dec.recommendedResponder.name}</p>
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-[10px] text-gray-400">Score: {dec.score}</span>
                          <span className="text-[10px] text-gray-400">ETA: {recommendedCandidate.durationMinutes} min</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400">No eligible unit</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Responder Status */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Responder Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-gray-700">Available</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{availableUnits.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="text-sm font-medium text-gray-700">Busy</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{busyUnits.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-gray-300" />
                <span className="text-sm font-medium text-gray-700">Offline</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{offlineUnits.length}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-2">Units</p>
            <div className="space-y-1.5">
              {demoResponders.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{r.name}</span>
                  <span className={`font-medium ${r.status === 'available' ? 'text-emerald-600' : r.status === 'busy' ? 'text-amber-500' : 'text-gray-400'}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Incident Demand */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Incident Demand</h3>
          </div>
          {Object.keys(breakdown).length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No data available</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(breakdown).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">{type}</span>
                    <span className="text-xs font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700" style={{ width: `${(count / maxCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5">
            <Navigation className="h-3 w-3 text-gray-400" />
            <span className="text-[10px] text-gray-400">Avg Rescue Score: {avgScore}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Filter className="h-3 w-3 text-gray-400" />
        <span className="text-[10px] text-gray-400">All data from prototype dataset — not live operational data</span>
      </div>
    </div>
  );
}
