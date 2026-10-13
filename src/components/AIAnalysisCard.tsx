import { Sparkles, Zap, AlertTriangle, Car, Truck, CloudRain, ShieldAlert, Wrench, Gauge, FileText, Brain } from 'lucide-react';
import type { AIIncidentAnalysis, AICapability } from '@/types/rescue';
import { AI_CAPABILITY_LABELS, AI_INCIDENT_TYPE_LABELS, AI_VEHICLE_TYPE_LABELS } from '@/types/rescue';

interface AIAnalysisCardProps {
  analysis: AIIncidentAnalysis;
  source: 'openai' | 'fallback';
}

const urgencyColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-50 text-orange-600',
  critical: 'bg-red-50 text-red-600',
};

const riskColors: Record<string, string> = {
  none: 'bg-gray-100 text-gray-500',
  low: 'bg-emerald-50 text-emerald-600',
  medium: 'bg-amber-50 text-amber-600',
  high: 'bg-red-50 text-red-600',
  unknown: 'bg-gray-100 text-gray-400',
};

function FieldRow({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`text-xs font-semibold capitalize ${valueClass ?? 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}

export function AIAnalysisCard({ analysis, source }: AIAnalysisCardProps) {
  const isAI = source === 'openai';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isAI ? 'bg-blue-50' : 'bg-amber-50'}`}>
            <Brain className={`h-4.5 w-4.5 ${isAI ? 'text-blue-500' : 'text-amber-500'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">AI Incident Analysis</p>
            <p className="text-[10px] text-gray-400">
              {isAI ? 'Powered by OpenAI' : 'Demo intelligence mode'}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${isAI ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
          {isAI ? 'AI' : 'Fallback'}
        </span>
      </div>

      {/* Fields */}
      <div className="space-y-0">
        <FieldRow
          icon={<AlertTriangle className="h-3.5 w-3.5 text-gray-400" />}
          label="Incident"
          value={AI_INCIDENT_TYPE_LABELS[analysis.incidentType]}
        />
        <FieldRow
          icon={<Car className="h-3.5 w-3.5 text-gray-400" />}
          label="Vehicle"
          value={AI_VEHICLE_TYPE_LABELS[analysis.vehicleType]}
        />
        <FieldRow
          icon={<Gauge className="h-3.5 w-3.5 text-gray-400" />}
          label="Urgency"
          value={analysis.urgency}
          valueClass={urgencyColors[analysis.urgency]}
        />
        <FieldRow
          icon={<Truck className="h-3.5 w-3.5 text-gray-400" />}
          label="Towing"
          value={analysis.requiresTowing ? 'Required' : 'Not needed'}
          valueClass={analysis.requiresTowing ? 'text-orange-600' : 'text-gray-500'}
        />
        <FieldRow
          icon={<CloudRain className="h-3.5 w-3.5 text-gray-400" />}
          label="Weather Risk"
          value={analysis.weatherRisk}
          valueClass={riskColors[analysis.weatherRisk]}
        />
        <FieldRow
          icon={<ShieldAlert className="h-3.5 w-3.5 text-gray-400" />}
          label="Roadside Risk"
          value={analysis.roadsideSafetyRisk}
          valueClass={riskColors[analysis.roadsideSafetyRisk]}
        />
      </div>

      {/* Required capabilities */}
      {analysis.requiredCapabilities.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Wrench className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Required Capabilities</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.requiredCapabilities.map((cap: AICapability) => (
              <span
                key={cap}
                className="rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600"
              >
                {AI_CAPABILITY_LABELS[cap]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confidence */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Confidence</span>
          </div>
          <span className="text-sm font-bold text-gray-900">
            {(analysis.confidence * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isAI ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-amber-400 to-amber-600'}`}
            style={{ width: `${analysis.confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Summary */}
      {analysis.shortSummary && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileText className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Summary</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{analysis.shortSummary}</p>
        </div>
      )}

      {/* Explanation */}
      {analysis.explanation && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Why this matters</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed italic">{analysis.explanation}</p>
        </div>
      )}
    </div>
  );
}
