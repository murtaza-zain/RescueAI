import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Brain,
  MapPin,
  Filter,
  Gauge,
  Sparkles,
  ArrowDown,
  Cpu,
  FileCheck,
} from 'lucide-react';
import type {
  Incident,
  AIIncidentAnalysis,
  CandidateResponse,
  RescueDecision,
  GeoDataSource,
} from '@/types/rescue';
import {
  AI_INCIDENT_TYPE_LABELS,
  AI_VEHICLE_TYPE_LABELS,
  AI_CAPABILITY_LABELS,
  CAPABILITY_LABELS,
} from '@/types/rescue';
import { SourceStatusBadge } from './SourceStatusBadge';

interface DecisionTraceProps {
  incident: Incident;
  analysis: AIIncidentAnalysis | null;
  aiSource: 'openai' | 'fallback';
  candidates: CandidateResponse[];
  decision: RescueDecision | null;
  geoSource: GeoDataSource;
  onAuditOpen?: () => void;
}

function StepHeader({ step, title, icon, source }: { step: string; title: string; icon: React.ReactNode; source?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-white">
          {icon}
        </div>
        <div>
          <span className="text-[10px] font-bold text-gray-400">{step}</span>
          <p className="text-sm font-semibold text-gray-900 -mt-0.5">{title}</p>
        </div>
      </div>
      {source}
    </div>
  );
}

export function DecisionTrace({
  incident,
  analysis,
  aiSource,
  candidates,
  decision,
  geoSource,
  onAuditOpen,
}: DecisionTraceProps) {
  const [expanded, setExpanded] = useState(false);

  const eligible = candidates.filter((c) => c.eligibility === 'eligible');
  const recommended = decision?.recommendedResponderId
    ? candidates.find((c) => c.responder.id === decision.recommendedResponderId) ?? null
    : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left"
        >
          <Cpu className="h-4 w-4 text-gray-700" />
          <span className="text-sm font-semibold text-gray-900">How RescueAI Decided</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400 ml-1" /> : <ChevronDown className="h-4 w-4 text-gray-400 ml-1" />}
        </button>
        {onAuditOpen && (
          <button
            onClick={onAuditOpen}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-all hover:bg-gray-50 hover:border-gray-300"
          >
            <FileCheck className="h-3.5 w-3.5" />
            Full Decision
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* STEP 1: Incident Intelligence */}
          <div>
            <StepHeader
              step="STEP 1"
              title="Incident Intelligence"
              icon={<Brain className="h-3.5 w-3.5" />}
              source={<SourceStatusBadge type="ai" live={aiSource === 'openai'} />}
            />
            <div className="mt-2.5 ml-9 space-y-1">
              {analysis ? (
                <>
                  <p className="text-xs text-gray-500">
                    Detected: <span className="font-medium text-gray-900">{AI_INCIDENT_TYPE_LABELS[analysis.incidentType]}</span>
                    {' · '}
                    <span className="font-medium text-gray-900">{AI_VEHICLE_TYPE_LABELS[analysis.vehicleType]}</span>
                    {' · '}
                    <span className="font-medium text-gray-900 capitalize">{analysis.urgency} urgency</span>
                  </p>
                  {analysis.requiredCapabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {analysis.requiredCapabilities.map((cap) => (
                        <span key={cap} className="rounded-md bg-blue-50 border border-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                          {AI_CAPABILITY_LABELS[cap]}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-400">No AI analysis yet</p>
              )}
            </div>
          </div>

          <div className="flex justify-center"><ArrowDown className="h-4 w-4 text-gray-300" /></div>

          {/* STEP 2: Geographic Analysis */}
          <div>
            <StepHeader
              step="STEP 2"
              title="Geographic Analysis"
              icon={<MapPin className="h-3.5 w-3.5" />}
              source={<SourceStatusBadge type="map" live={geoSource === 'goong'} />}
            />
            <div className="mt-2.5 ml-9 space-y-1">
              <p className="text-xs text-gray-500">
                Incident: <span className="font-medium text-gray-900">{incident.location}</span>
              </p>
              {eligible.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Candidate Travel Estimates</p>
                  {eligible.map((c) => (
                    <p key={c.responder.id} className="text-xs text-gray-500">
                      {c.responder.name} — {c.durationMinutes} min
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center"><ArrowDown className="h-4 w-4 text-gray-300" /></div>

          {/* STEP 3: Eligibility */}
          <div>
            <StepHeader step="STEP 3" title="Eligibility" icon={<Filter className="h-3.5 w-3.5" />} />
            <div className="mt-2.5 ml-9 space-y-1.5">
              {candidates.length === 0 ? (
                <p className="text-xs text-gray-400">No candidates evaluated</p>
              ) : (
                candidates.map((c) => (
                  <div key={c.responder.id} className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">{c.responder.name}</span>
                    {c.eligibility === 'eligible' ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">ELIGIBLE</span>
                    ) : (
                      <span className="text-[10px] text-gray-400">
                        INELIGIBLE — {c.missingCapabilities.length > 0
                          ? `Missing ${c.missingCapabilities.map((m) => CAPABILITY_LABELS[m] || m).join(', ')}`
                          : c.eligibilityReason}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-center"><ArrowDown className="h-4 w-4 text-gray-300" /></div>

          {/* STEP 4: Rescue Score */}
          <div>
            <StepHeader step="STEP 4" title="Rescue Score" icon={<Gauge className="h-3.5 w-3.5" />} />
            <div className="mt-2.5 ml-9 space-y-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Weighted Formula</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Capability Fit <span className="font-bold text-gray-900">50%</span></span>
                <span>Response Time <span className="font-bold text-gray-900">35%</span></span>
                <span>Availability <span className="font-bold text-gray-900">15%</span></span>
              </div>
            </div>
          </div>

          <div className="flex justify-center"><ArrowDown className="h-4 w-4 text-gray-300" /></div>

          {/* STEP 5: Recommendation */}
          <div>
            <StepHeader step="STEP 5" title="Recommendation" icon={<Sparkles className="h-3.5 w-3.5" />} />
            <div className="mt-2.5 ml-9">
              {recommended ? (
                <div className="rounded-lg bg-gray-900 p-3">
                  <p className="text-sm font-bold text-white">{recommended.responder.name}</p>
                  <p className="text-2xl font-bold text-white">{recommended.score} <span className="text-sm text-gray-400 font-normal">/ 100</span></p>
                  <p className="text-[10px] text-gray-300 mt-1">{decision?.decisionReason}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No eligible responder found</p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <SourceStatusBadge type="decision" live={true} />
            {onAuditOpen && (
              <button
                onClick={onAuditOpen}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 transition-all hover:text-blue-700"
              >
                <FileCheck className="h-3 w-3" />
                View Full Decision
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
