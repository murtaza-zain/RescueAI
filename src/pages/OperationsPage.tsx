import { ArrowLeft, ShieldPlus, Radio } from 'lucide-react';
import type { ViewName } from '@/types/rescue';
import { OperationsPanel } from '@/components/OperationsPanel';
import { SourceStatusBadge } from '@/components/SourceStatusBadge';
import { isGoongConfigured } from '@/services/goong';

interface OperationsPageProps {
  onNavigate: (view: ViewName) => void;
}

export function OperationsPage({ onNavigate }: OperationsPageProps) {
  const goongReady = isGoongConfigured();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 transition-all hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900">
                <ShieldPlus className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 tracking-tight">RESCUEAI</p>
                <p className="text-[10px] text-gray-400 -mt-0.5 flex items-center gap-1">
                  <Radio className="h-2.5 w-2.5" /> Mission Control
                </p>
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <button onClick={() => onNavigate('dashboard')} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-all hover:bg-gray-50">Dashboard</button>
            <button onClick={() => onNavigate('incident')} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-all hover:bg-gray-50">Incident</button>
            <button onClick={() => onNavigate('operations')} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-900 bg-gray-100">Operations</button>
          </nav>
          <div className="flex items-center gap-2">
            <SourceStatusBadge type="ai" live={false} />
            <SourceStatusBadge type="map" live={goongReady} />
            <button
              onClick={() => onNavigate('incident')}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50"
            >
              Report Incident
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <OperationsPanel onIncidentClick={() => onNavigate('incident')} />
      </div>
    </div>
  );
}
