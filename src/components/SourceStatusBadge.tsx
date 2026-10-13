import { Brain, MapPin, Cpu, CheckCircle2 } from 'lucide-react';

interface SourceStatusBadgeProps {
  type: 'ai' | 'map' | 'decision';
  live: boolean;
}

export function SourceStatusBadge({ type, live }: SourceStatusBadgeProps) {
  const config = {
    ai: {
      icon: Brain,
      liveLabel: 'OpenAI',
      demoLabel: 'Demo Intelligence',
    },
    map: {
      icon: MapPin,
      liveLabel: 'Goong',
      demoLabel: 'Demo Geographic',
    },
    decision: {
      icon: Cpu,
      liveLabel: 'RescueAI Engine',
      demoLabel: 'RescueAI Engine',
    },
  };

  const { icon: Icon, liveLabel, demoLabel } = config[type];
  const label = live ? liveLabel : demoLabel;
  const colorClass = live
    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
    : 'bg-gray-50 text-gray-500 border-gray-200';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${colorClass}`}>
      {live ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}

export function SourceStatusCluster({ aiLive, mapLive }: { aiLive: boolean; mapLive: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <SourceStatusBadge type="ai" live={aiLive} />
      <SourceStatusBadge type="map" live={mapLive} />
    </div>
  );
}
