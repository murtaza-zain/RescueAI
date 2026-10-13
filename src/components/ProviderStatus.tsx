import { Brain, MapPin, Cpu } from 'lucide-react';

export type ProviderState = 'connected' | 'demo' | 'error';

interface ProviderStatusProps {
  aiState: ProviderState;
  mapState: ProviderState;
  decisionState?: ProviderState;
  compact?: boolean;
}

function StatusPill({ label, state, icon }: { label: string; state: ProviderState; icon: React.ReactNode }) {
  const styles: Record<ProviderState, { dot: string; text: string; bg: string; suffix: string }> = {
    connected: { dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', suffix: 'Connected' },
    demo: { dot: 'bg-gray-400', text: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', suffix: 'Demo / Fallback' },
    error: { dot: 'bg-red-400', text: 'text-red-500', bg: 'bg-red-50 border-red-200', suffix: 'Error' },
  };

  const s = styles[state];

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${s.bg}`}>
      <span className={s.text}>{icon}</span>
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      <span className={`flex items-center gap-1 text-[11px] font-medium ${s.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${state === 'connected' ? 'animate-pulse' : ''}`} />
        {s.suffix}
      </span>
    </div>
  );
}

export function ProviderStatus({ aiState, mapState, decisionState = 'connected', compact }: ProviderStatusProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <StatusPillCompact label="OpenAI" state={aiState} icon={<Brain className="h-3 w-3" />} />
        <StatusPillCompact label="Goong" state={mapState} icon={<MapPin className="h-3 w-3" />} />
        <StatusPillCompact label="RescueAI" state={decisionState} icon={<Cpu className="h-3 w-3" />} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Provider Status</p>
      <div className="flex flex-col gap-2">
        <StatusPill label="OpenAI" state={aiState} icon={<Brain className="h-3.5 w-3.5" />} />
        <StatusPill label="Goong" state={mapState} icon={<MapPin className="h-3.5 w-3.5" />} />
        <StatusPill label="RescueAI Engine" state={decisionState} icon={<Cpu className="h-3.5 w-3.5" />} />
      </div>
    </div>
  );
}

function StatusPillCompact({ label, state, icon }: { label: string; state: ProviderState; icon: React.ReactNode }) {
  const dotColor = state === 'connected' ? 'bg-emerald-500' : state === 'error' ? 'bg-red-400' : 'bg-gray-400';
  const textColor = state === 'connected' ? 'text-emerald-600' : state === 'error' ? 'text-red-500' : 'text-gray-500';
  return (
    <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${state === 'connected' ? 'bg-emerald-50 border-emerald-200' : state === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
      <span className={textColor}>{icon}</span>
      <span className="text-[10px] font-medium text-gray-600">{label}</span>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
    </div>
  );
}

