import { ShieldPlus, ArrowRight, Map as MapIcon, Brain, MapPin, Cpu, ArrowDown } from 'lucide-react';
import type { ViewName } from '@/types/rescue';
import { SourceStatusBadge } from '@/components/SourceStatusBadge';
import { isGoongConfigured } from '@/services/goong';

interface DashboardProps {
  onNavigate: (view: ViewName) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const goongReady = isGoongConfigured();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900">
              <ShieldPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 tracking-tight">RESCUEAI</p>
              <p className="text-[10px] text-gray-400 -mt-0.5">
                AI-powered roadside response intelligence
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-900 bg-gray-100"
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('incident')}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-all hover:bg-gray-50"
            >
              Incident
            </button>
            <button
              onClick={() => onNavigate('operations')}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-all hover:bg-gray-50"
            >
              Operations
            </button>
          </nav>
          <div className="flex items-center gap-2">
            <SourceStatusBadge type="ai" live={false} />
            <SourceStatusBadge type="map" live={goongReady} />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-500">
              {goongReady ? 'Live mapping active' : 'Prototype mode — fully demoable without API keys'}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-[1.1]">
            WHEN YOUR VEHICLE STOPS,
            <br />
            THE MAP STARTS SOLVING.
          </h1>

          <p className="mt-5 text-base text-gray-500 leading-relaxed max-w-lg">
            RescueAI understands the incident, verifies the location, evaluates
            eligible responders, and explains the response it recommends.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate('incident')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-200"
            >
              Report Vehicle Incident
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate('operations')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              <MapIcon className="h-4 w-4" />
              Open Operations
            </button>
          </div>
        </div>
      </section>

      {/* Three-step visual */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              step: '01',
              title: 'UNDERSTAND',
              icon: <Brain className="h-5 w-5" />,
              desc: 'OpenAI turns a natural-language report into structured incident requirements.',
            },
            {
              step: '02',
              title: 'LOCATE',
              icon: <MapPin className="h-5 w-5" />,
              desc: 'Goong provides geographic and route information.',
            },
            {
              step: '03',
              title: 'DECIDE',
              icon: <Cpu className="h-5 w-5" />,
              desc: 'RescueAI applies transparent eligibility and scoring rules.',
            },
          ].map((f, idx) => (
            <div key={f.step} className="relative">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-gray-300 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
                    {f.icon}
                  </div>
                  <span className="text-xs font-bold text-gray-300">{f.step}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 tracking-wide">{f.title}</h3>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
              {idx < 2 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ArrowDown className="h-4 w-4 text-gray-300 rotate-[-90deg]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Architecture summary */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Architecture</p>
          <div className="flex flex-col md:flex-row items-stretch gap-3">
            <div className="flex-1 rounded-xl bg-white border border-gray-200 p-4">
              <p className="text-sm font-bold text-gray-900 mb-1">OpenAI</p>
              <p className="text-xs text-gray-500">"What is happening?"</p>
            </div>
            <div className="hidden md:flex items-center justify-center"><ArrowRight className="h-4 w-4 text-gray-300" /></div>
            <div className="flex-1 rounded-xl bg-white border border-gray-200 p-4">
              <p className="text-sm font-bold text-gray-900 mb-1">Goong</p>
              <p className="text-xs text-gray-500">"Where is it and how long does the route take?"</p>
            </div>
            <div className="hidden md:flex items-center justify-center"><ArrowRight className="h-4 w-4 text-gray-300" /></div>
            <div className="flex-1 rounded-xl bg-gray-900 p-4">
              <p className="text-sm font-bold text-white mb-1">RescueAI</p>
              <p className="text-xs text-gray-300">"Which eligible response fits the incident?"</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            RescueAI — Deterministic roadside response intelligence
          </p>
          <div className="flex items-center gap-2">
            <SourceStatusBadge type="ai" live={false} />
            <SourceStatusBadge type="map" live={goongReady} />
          </div>
        </div>
      </footer>
    </div>
  );
}
