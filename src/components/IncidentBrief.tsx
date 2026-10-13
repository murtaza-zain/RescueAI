import { FileText, Sparkles } from 'lucide-react';
import type {
  Incident,
  AIIncidentAnalysis,
  CandidateResponse,
  RescueDecision,
} from '@/types/rescue';
import {
  AI_INCIDENT_TYPE_LABELS,
  AI_VEHICLE_TYPE_LABELS,
  AI_CAPABILITY_LABELS,
} from '@/types/rescue';

interface IncidentBriefProps {
  incident: Incident;
  analysis: AIIncidentAnalysis | null;
  recommended: CandidateResponse | null;
  decision: RescueDecision | null;
}

function BriefRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}

function buildSummary(
  incident: Incident,
  analysis: AIIncidentAnalysis | null,
  recommended: CandidateResponse | null,
): string {
  const parts: string[] = [];

  const incidentLabel = analysis
    ? AI_INCIDENT_TYPE_LABELS[analysis.incidentType]
    : incident.problemType;
  const vehicleLabel = analysis
    ? AI_VEHICLE_TYPE_LABELS[analysis.vehicleType]
    : incident.vehicleType;

  const conditionClause = incident.situation === 'Heavy rain'
    ? ' during heavy rain'
    : incident.situation === 'Night-time'
      ? ' at night'
      : '';

  parts.push(`${incidentLabel} involving a ${vehicleLabel}${conditionClause}.`);

  if (analysis && analysis.requiredCapabilities.length > 0) {
    const caps = analysis.requiredCapabilities
      .map((c) => AI_CAPABILITY_LABELS[c].toLowerCase())
      .join(' and ');
    parts.push(`Requires ${caps}.`);
  }

  if (recommended) {
    const capClause = recommended.matchedCapabilities.length > 0
      ? 'satisfies the required capabilities'
      : 'is the best available match';
    parts.push(
      `${recommended.responder.name} is eligible because it ${capClause} and has a ${recommended.durationMinutes}-minute estimated response.`,
    );
  } else {
    parts.push('No eligible responder was found in the current dataset.');
  }

  return parts.join(' ');
}

export function IncidentBrief({ incident, analysis, recommended, decision }: IncidentBriefProps) {
  const summary = buildSummary(incident, analysis, recommended);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-4 w-4 text-gray-700" />
        <p className="text-sm font-semibold text-gray-900">Incident Brief</p>
      </div>

      <div className="space-y-0 mb-3">
        <BriefRow label="Incident" value={analysis ? AI_INCIDENT_TYPE_LABELS[analysis.incidentType] : incident.problemType} />
        <BriefRow label="Vehicle" value={analysis ? AI_VEHICLE_TYPE_LABELS[analysis.vehicleType] : incident.vehicleType} />
        <BriefRow label="Urgency" value={analysis ? analysis.urgency : incident.priority} />
        <BriefRow
          label="Required capabilities"
          value={analysis
            ? analysis.requiredCapabilities.map((c) => AI_CAPABILITY_LABELS[c]).join(', ')
            : incident.problemType}
        />
        <BriefRow
          label="Selected responder"
          value={recommended ? recommended.responder.name : 'None'}
        />
        <BriefRow
          label="Estimated response"
          value={recommended ? `${recommended.durationMinutes} min` : '—'}
        />
        <BriefRow
          label="Rescue Score"
          value={recommended ? `${recommended.score} / 100` : '—'}
        />
      </div>

      <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
        <p className="text-xs text-gray-600 leading-relaxed">{summary}</p>
      </div>

      {decision && (
        <div className="mt-2 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-gray-400" />
          <span className="text-[10px] text-gray-400">
            Generated {new Date(decision.generatedAt).toLocaleTimeString()} · {decision.source === 'live' ? 'Live' : 'Demo'}
          </span>
        </div>
      )}
    </div>
  );
}
