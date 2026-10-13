import { X, Printer, FileCheck, Brain, MapPin, Filter, Gauge, Sparkles, Route as RouteIcon } from 'lucide-react';
import type {
  Incident,
  AIIncidentAnalysis,
  CandidateResponse,
  RescueDecision,
  GoongRouteResult,
  GeoDataSource,
} from '@/types/rescue';
import {
  AI_INCIDENT_TYPE_LABELS,
  AI_VEHICLE_TYPE_LABELS,
  AI_CAPABILITY_LABELS,
  CAPABILITY_LABELS,
} from '@/types/rescue';
import { SourceStatusBadge } from './SourceStatusBadge';

interface DecisionAuditProps {
  open: boolean;
  onClose: () => void;
  incident: Incident;
  analysis: AIIncidentAnalysis | null;
  aiSource: 'openai' | 'fallback';
  candidates: CandidateResponse[];
  decision: RescueDecision | null;
  geoSource: GeoDataSource;
  routeResult: GoongRouteResult | null;
}

function AuditSection({ number, title, icon, children }: { number: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-900 text-white text-[10px] font-bold">{number}</span>
        <span className="text-gray-700">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="ml-8">{children}</div>
    </div>
  );
}

function AuditRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-1">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-900 text-right ml-3 break-words">{value}</span>
    </div>
  );
}

export function DecisionAudit({
  open,
  onClose,
  incident,
  analysis,
  aiSource,
  candidates,
  decision,
  geoSource,
  routeResult,
}: DecisionAuditProps) {
  if (!open) return null;

  const recommended = decision?.recommendedResponderId
    ? candidates.find((c) => c.responder.id === decision.recommendedResponderId) ?? null
    : null;
  const eligible = candidates.filter((c) => c.eligibility === 'eligible');

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto py-8 print:bg-white print:p-0 print:static" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 p-6 print:shadow-none print:rounded-none print:max-w-none print:m-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Decision Audit Report</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 transition-all hover:bg-gray-50"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Print-only title */}
        <div className="hidden print:block mb-6">
          <h1 className="text-xl font-bold text-gray-900">RescueAI Decision Audit Report</h1>
          <p className="text-sm text-gray-500">{incident.id} · {new Date(decision?.generatedAt ?? Date.now()).toLocaleString()}</p>
        </div>

        {/* Provenance */}
        <div className="flex flex-wrap items-center gap-2 mb-5 pb-4 border-b border-gray-100">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mr-1">Provenance:</span>
          <SourceStatusBadge type="ai" live={aiSource === 'openai'} />
          <SourceStatusBadge type="map" live={geoSource === 'goong'} />
          <SourceStatusBadge type="decision" live={true} />
        </div>

        {/* Section 1: Incident Input */}
        <AuditSection number="1" title="Incident Input" icon={<Brain className="h-4 w-4 text-gray-400" />}>
          <AuditRow label="Description" value={incident.description} />
          <AuditRow label="Location" value={incident.location} />
          <AuditRow label="Coordinates" value={`${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`} />
          <AuditRow label="Vehicle" value={incident.vehicleType} />
          <AuditRow label="Problem" value={incident.problemType} />
          <AuditRow label="Situation" value={incident.situation} />
          <AuditRow label="Priority" value={incident.priority} />
        </AuditSection>

        {/* Section 2: AI Analysis */}
        <AuditSection number="2" title="AI Analysis" icon={<Sparkles className="h-4 w-4 text-gray-400" />}>
          {analysis ? (
            <>
              <AuditRow label="Source" value={aiSource === 'openai' ? 'OpenAI' : 'Demo Intelligence'} />
              <AuditRow label="Incident type" value={AI_INCIDENT_TYPE_LABELS[analysis.incidentType]} />
              <AuditRow label="Vehicle type" value={AI_VEHICLE_TYPE_LABELS[analysis.vehicleType]} />
              <AuditRow label="Urgency" value={analysis.urgency} />
              <AuditRow label="Towing required" value={analysis.requiresTowing ? 'Yes' : 'No'} />
              <AuditRow label="Weather risk" value={analysis.weatherRisk} />
              <AuditRow label="Roadside safety risk" value={analysis.roadsideSafetyRisk} />
              <AuditRow label="Confidence" value={`${(analysis.confidence * 100).toFixed(0)}%`} />
              <AuditRow
                label="Required capabilities"
                value={analysis.requiredCapabilities.map((c) => AI_CAPABILITY_LABELS[c]).join(', ')}
              />
              <AuditRow label="Summary" value={analysis.shortSummary} />
            </>
          ) : (
            <p className="text-xs text-gray-400">No AI analysis available</p>
          )}
        </AuditSection>

        {/* Section 3: Geographic Analysis */}
        <AuditSection number="3" title="Geographic Analysis" icon={<MapPin className="h-4 w-4 text-gray-400" />}>
          <AuditRow label="Source" value={geoSource === 'goong' ? 'Goong' : 'Demo Geographic'} />
          <AuditRow label="Incident location" value={incident.location} />
          {eligible.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1">Candidate Travel Estimates</p>
              {candidates.map((c) => (
                <AuditRow
                  key={c.responder.id}
                  label={c.responder.name}
                  value={`${c.durationMinutes} min · ${c.distanceKm} km · ${c.routeAvailable ? 'Goong route' : 'Estimated'}`}
                />
              ))}
            </div>
          )}
        </AuditSection>

        {/* Section 4: Eligibility */}
        <AuditSection number="4" title="Eligibility" icon={<Filter className="h-4 w-4 text-gray-400" />}>
          {candidates.length === 0 ? (
            <p className="text-xs text-gray-400">No candidates evaluated</p>
          ) : (
            <div className="space-y-1">
              {candidates.map((c) => (
                <div key={c.responder.id} className="flex items-start justify-between py-1">
                  <span className="text-xs font-medium text-gray-700">{c.responder.name}</span>
                  <div className="text-right">
                    {c.eligibility === 'eligible' ? (
                      <span className="text-xs font-medium text-emerald-600">Eligible</span>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-red-500">Ineligible</span>
                        <p className="text-[10px] text-gray-400">
                          {c.missingCapabilities.length > 0
                            ? `Missing: ${c.missingCapabilities.map((m) => CAPABILITY_LABELS[m] || m).join(', ')}`
                            : c.eligibilityReason}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AuditSection>

        {/* Section 5: Rescue Score */}
        <AuditSection number="5" title="Rescue Score" icon={<Gauge className="h-4 w-4 text-gray-400" />}>
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <span>Capability Fit: <span className="font-bold text-gray-900">50%</span></span>
            <span>Response Time: <span className="font-bold text-gray-900">35%</span></span>
            <span>Availability: <span className="font-bold text-gray-900">15%</span></span>
          </div>
          {eligible.length > 0 && (
            <div className="space-y-1">
              {eligible.map((c) => (
                <AuditRow
                  key={c.responder.id}
                  label={c.responder.name}
                  value={`Cap ${c.breakdown.capabilityFit} · Time ${c.breakdown.responseTime} · Avail ${c.breakdown.availability} = ${c.score}`}
                />
              ))}
            </div>
          )}
        </AuditSection>

        {/* Section 6: Recommendation */}
        <AuditSection number="6" title="Recommendation" icon={<Sparkles className="h-4 w-4 text-gray-400" />}>
          {recommended ? (
            <>
              <AuditRow label="Recommended" value={recommended.responder.name} />
              <AuditRow label="Rescue Score" value={`${recommended.score} / 100`} />
              <AuditRow label="ETA" value={`${recommended.durationMinutes} min`} />
              <AuditRow label="Distance" value={`${recommended.distanceKm} km`} />
              <AuditRow label="Reason" value={decision?.decisionReason ?? ''} />
            </>
          ) : (
            <p className="text-xs text-gray-400">No eligible responder found</p>
          )}
        </AuditSection>

        {/* Section 7: Route */}
        <AuditSection number="7" title="Route" icon={<RouteIcon className="h-4 w-4 text-gray-400" />}>
          {routeResult && routeResult.metrics ? (
            <>
              <AuditRow label="Route source" value={routeResult.source === 'goong' ? 'Goong Directions' : 'Demo (straight-line)'} />
              <AuditRow label="Distance" value={routeResult.metrics.distanceText} />
              <AuditRow label="Duration" value={routeResult.metrics.durationText} />
              <AuditRow label="Polyline" value={routeResult.encodedPolyline ? 'Available' : 'Not available'} />
            </>
          ) : (
            <p className="text-xs text-gray-400">No route requested</p>
          )}
        </AuditSection>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-400">
            RescueAI Decision Audit · {decision?.source === 'live' ? 'Live providers' : 'Demo mode'} · Generated {new Date(decision?.generatedAt ?? Date.now()).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
