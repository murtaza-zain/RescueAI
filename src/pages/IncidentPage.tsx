import { useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft, MapPin, Users, Building2, ListChecks, Brain, Route as RouteIcon,
  Loader2, Sparkles, AlertCircle, RotateCcw, ShieldPlus,
} from 'lucide-react';
import type {
  ViewName, Incident, Responder, AIIncidentAnalysis, GeocodedLocation,
  GeoPoint, RouteMetrics, CandidateResponse, GoongRouteResult, GeoDataSource,
  RescueDecision,
} from '@/types/rescue';
import { IncidentForm } from '@/components/IncidentForm';
import { IncidentCard } from '@/components/IncidentCard';
import { ResponderCard } from '@/components/ResponderCard';
import { MapView } from '@/components/MapView';
import { AIAnalysisCard } from '@/components/AIAnalysisCard';
import { RouteCard } from '@/components/RouteCard';
import { RescueScoreCard } from '@/components/RescueScoreCard';
import { CandidateComparison } from '@/components/CandidateComparison';
import { WhyNotClosest } from '@/components/WhyNotClosest';
import { DecisionTrace } from '@/components/DecisionTrace';
import { DecisionAudit } from '@/components/DecisionAudit';
import { IncidentBrief } from '@/components/IncidentBrief';
import { ProviderStatus, type ProviderState } from '@/components/ProviderStatus';
import { rescueData, buildCandidateResponses } from '@/services/rescueData';
import { demoResponders } from '@/data/demoResponders';
import { demoServiceCentres } from '@/data/demoServiceCentres';
import { getDistanceMatrix, getDirections } from '@/services/goong';
import { generateRescueDecision } from '@/services/rescueDecisionEngine';

interface IncidentPageProps {
  onNavigate: (view: ViewName) => void;
}

type GeoPhase = 'idle' | 'understanding' | 'calculating' | 'selecting' | 'loading_route' | 'ready';

export function IncidentPage({ onNavigate }: IncidentPageProps) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [selectedResponderId, setSelectedResponderId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIIncidentAnalysis | null>(null);
  const [aiSource, setAiSource] = useState<'openai' | 'fallback'>('fallback');
  const [, setGeocodedLocation] = useState<GeocodedLocation | null>(null);
  const [, setGeoSource] = useState<GeoDataSource>('fallback');
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics[] | null>(null);
  const [metricsSource, setMetricsSource] = useState<GeoDataSource>('fallback');
  const [candidates, setCandidates] = useState<CandidateResponse[]>([]);
  const [decision, setDecision] = useState<RescueDecision | null>(null);
  const [routeResult, setRouteResult] = useState<GoongRouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [geoPhase, setGeoPhase] = useState<GeoPhase>('idle');
  const [auditOpen, setAuditOpen] = useState(false);

  // Build candidates + decision when incident/metrics change
  useEffect(() => {
    if (!incident) { setCandidates([]); setDecision(null); return; }
    setGeoPhase('selecting');
    const built = buildCandidateResponses(incident, aiAnalysis, demoResponders, routeMetrics, metricsSource);
    setCandidates(built);

    const dec = generateRescueDecision(incident, aiAnalysis, built, metricsSource, aiSource);
    setDecision(dec);

    if (dec.recommendedResponderId && !selectedResponderId) {
      setSelectedResponderId(dec.recommendedResponderId);
    }
    setGeoPhase('ready');
  }, [incident, aiAnalysis, routeMetrics, metricsSource, aiSource]);

  // Fetch distance matrix when incident is set
  useEffect(() => {
    if (!incident) return;
    let cancelled = false;
    setGeoPhase('calculating');
    const origin: GeoPoint = { lat: incident.latitude, lng: incident.longitude };
    const destinations = demoResponders.filter((r) => r.available).map((r) => ({ lat: r.latitude, lng: r.longitude }));

    getDistanceMatrix(origin, destinations).then((result) => {
      if (cancelled) return;
      const availableResponders = demoResponders.filter((r) => r.available);
      const fullMetrics: RouteMetrics[] = demoResponders.map((r) => {
        const idx = availableResponders.indexOf(r);
        return idx >= 0 ? result.metrics[idx] : { distanceMeters: 0, distanceKm: 0, durationSeconds: 0, durationMinutes: 0, distanceText: '—', durationText: '—' };
      });
      setRouteMetrics(fullMetrics);
      setMetricsSource(result.source);
    }).catch(() => {
      if (cancelled) return;
    }).finally(() => {
      if (!cancelled) setGeoPhase('ready');
    });

    return () => { cancelled = true; };
  }, [incident]);

  // Fetch directions when responder selected
  useEffect(() => {
    if (!incident || !selectedResponderId) { setRouteResult(null); return; }
    const responder = demoResponders.find((r) => r.id === selectedResponderId);
    if (!responder) { setRouteResult(null); return; }

    let cancelled = false;
    setRouteLoading(true);
    setGeoPhase('loading_route');

    const origin: GeoPoint = { lat: responder.latitude, lng: responder.longitude };
    const destination: GeoPoint = { lat: incident.latitude, lng: incident.longitude };

    getDirections(origin, destination, responder.id).then((result) => {
      if (cancelled) return;
      setRouteResult(result);
      setRouteLoading(false);
      setGeoPhase('ready');
    }).catch(() => {
      if (cancelled) return;
      setRouteLoading(false);
      setGeoPhase('ready');
    });

    return () => { cancelled = true; };
  }, [incident, selectedResponderId]);

  const handleResponderClick = useCallback((r: Responder) => {
    setSelectedResponderId(r.id);
  }, []);

  function handleSubmit(data: Omit<Incident, 'id' | 'createdAt' | 'status'>) {
    setGeoPhase('understanding');
    const newIncident: Incident = {
      ...data,
      id: `INC-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      status: 'reported',
    };
    setIncident(newIncident);
    setSelectedResponderId(null);
    setRouteResult(null);
    setRouteMetrics(null);
  }

  function handleAnalysis(analysis: AIIncidentAnalysis, source: 'openai' | 'fallback') {
    setAiAnalysis(analysis);
    setAiSource(source);
  }

  function handleGeocode(location: GeocodedLocation, source: 'goong' | 'fallback') {
    setGeocodedLocation(location);
    setGeoSource(source);
  }

  function handleReset() {
    setIncident(null);
    setSelectedResponderId(null);
    setAiAnalysis(null);
    setAiSource('fallback');
    setGeocodedLocation(null);
    setGeoSource('fallback');
    setRouteMetrics(null);
    setMetricsSource('fallback');
    setCandidates([]);
    setDecision(null);
    setRouteResult(null);
    setRouteLoading(false);
    setGeoPhase('idle');
    setAuditOpen(false);
  }

  const selectedResponder = selectedResponderId ? rescueData.getResponderById(selectedResponderId) : null;
  const routeOrigin = selectedResponder ? { lat: selectedResponder.latitude, lng: selectedResponder.longitude } : null;
  const routeDestination = incident ? { lat: incident.latitude, lng: incident.longitude } : null;

  const recommendedCandidate = decision?.recommendedResponderId
    ? candidates.find((c) => c.responder.id === decision.recommendedResponderId) ?? null
    : null;

  const geoPhaseLabel: Record<GeoPhase, string> = {
    idle: '',
    understanding: 'Understanding incident...',
    calculating: 'Calculating response options...',
    selecting: 'Selecting eligible response...',
    loading_route: 'Loading route...',
    ready: 'Response ready',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('dashboard')} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 transition-all hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900">
                <ShieldPlus className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 tracking-tight">RESCUEAI</p>
                <p className="text-[10px] text-gray-400 -mt-0.5">{incident ? incident.id : 'Report Incident'}</p>
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <button onClick={() => onNavigate('dashboard')} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-all hover:bg-gray-50">Dashboard</button>
            <button onClick={() => onNavigate('incident')} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-900 bg-gray-100">Incident</button>
            <button onClick={() => onNavigate('operations')} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-all hover:bg-gray-50">Operations</button>
          </nav>
          <div className="flex items-center gap-2">
            <ProviderStatus
              compact
              aiState={aiSource === 'openai' ? 'connected' : 'demo' as ProviderState}
              mapState={metricsSource === 'goong' ? 'connected' : 'demo' as ProviderState}
              decisionState="connected"
            />
            {incident && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Demo
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {!incident ? (
          <div className="mx-auto max-w-2xl">
            {/* Workflow indicator */}
            <div className="mb-4 flex items-center justify-center gap-2 text-xs font-medium text-gray-400">
              <span className="rounded-full bg-gray-900 text-white px-2.5 py-1">REPORT</span>
              <span className="text-gray-300">→</span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1">UNDERSTAND</span>
              <span className="text-gray-300">→</span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1">MATCH</span>
              <span className="text-gray-300">→</span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1">ROUTE</span>
            </div>
            <IncidentForm onSubmit={handleSubmit} onAnalysis={handleAnalysis} onGeocode={handleGeocode} />
          </div>
        ) : (
          <>
            {/* Workflow indicator */}
            <div className="mb-4 flex items-center justify-center gap-2 text-xs font-medium text-gray-400">
              <span className="rounded-full bg-emerald-500 text-white px-2.5 py-1">REPORT</span>
              <span className="text-gray-300">→</span>
              <span className={`rounded-full px-2.5 py-1 ${aiAnalysis ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white'}`}>UNDERSTAND</span>
              <span className="text-gray-300">→</span>
              <span className={`rounded-full px-2.5 py-1 ${candidates.length > 0 ? 'bg-emerald-500 text-white' : 'bg-gray-100'}`}>MATCH</span>
              <span className="text-gray-300">→</span>
              <span className={`rounded-full px-2.5 py-1 ${routeResult ? 'bg-emerald-500 text-white' : 'bg-gray-100'}`}>ROUTE</span>
            </div>

            {/* Mobile: stacked layout. Desktop: 3-column */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT: Incident + AI Analysis (mobile order: first) */}
              <div className="lg:col-span-3 space-y-4 order-1 lg:order-1">
                {/* Incident card */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <MapPin className="h-3.5 w-3.5" />Incident
                  </div>
                  <IncidentCard incident={incident} />
                </div>

                {/* AI Analysis card */}
                {aiAnalysis && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <Brain className="h-3.5 w-3.5" />AI Analysis
                    </div>
                    <AIAnalysisCard analysis={aiAnalysis} source={aiSource} />
                  </div>
                )}

                {/* Incident Brief */}
                {decision && (
                  <IncidentBrief
                    incident={incident}
                    analysis={aiAnalysis}
                    recommended={recommendedCandidate}
                    decision={decision}
                  />
                )}

                {/* Decision Trace */}
                {decision && (
                  <DecisionTrace
                    incident={incident}
                    analysis={aiAnalysis}
                    aiSource={aiSource}
                    candidates={candidates}
                    decision={decision}
                    geoSource={metricsSource}
                    onAuditOpen={() => setAuditOpen(true)}
                  />
                )}
              </div>

              {/* CENTER: Map (mobile order: third, after recommendation) */}
              <div className="lg:col-span-6 lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)] order-3 lg:order-2">
                <MapView
                  incident={incident}
                  responders={demoResponders}
                  serviceCentres={demoServiceCentres}
                  onResponderClick={handleResponderClick}
                  selectedResponderId={selectedResponderId}
                  routePolyline={routeResult?.encodedPolyline}
                  routeOrigin={routeOrigin}
                  routeDestination={routeDestination}
                  candidates={candidates}
                  recommendedId={decision?.recommendedResponderId ?? null}
                />
              </div>

              {/* RIGHT: Recommendation + comparison (mobile order: second) */}
              <div className="lg:col-span-3 space-y-4 order-2 lg:order-3">
                {/* Loading state */}
                {geoPhase !== 'idle' && geoPhase !== 'ready' && (
                  <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                    <span className="text-xs font-medium text-blue-600">{geoPhaseLabel[geoPhase]}</span>
                  </div>
                )}

                {/* Recommendation banner */}
                {decision && recommendedCandidate && (
                  <div className="rounded-2xl border border-gray-900 bg-gray-900 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-white" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-300">RescueAI Recommendation</p>
                    </div>
                    <p className="text-sm font-medium text-white mb-1">
                      {recommendedCandidate.responder.name} is the strongest eligible response.
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-white">{decision.score}</span>
                      <span className="text-sm text-gray-400">/ 100 Rescue Score</span>
                    </div>
                  </div>
                )}

                {/* No eligible responders */}
                {decision && !recommendedCandidate && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <p className="text-sm font-semibold text-amber-700">No eligible responder found</p>
                    </div>
                    <p className="text-xs text-amber-600">{decision.decisionReason}</p>
                  </div>
                )}

                {/* Rescue Score Card */}
                {recommendedCandidate && decision && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <Sparkles className="h-3.5 w-3.5" />Recommended Response
                    </div>
                    <RescueScoreCard candidate={recommendedCandidate} decisionReason={decision.decisionReason} />
                  </div>
                )}

                {/* Why not closest */}
                {decision && recommendedCandidate && (
                  <WhyNotClosest candidates={candidates} recommended={recommendedCandidate} />
                )}

                {/* Candidate comparison */}
                {candidates.length > 0 && (
                  <CandidateComparison candidates={candidates} recommendedId={decision?.recommendedResponderId ?? null} />
                )}

                {/* Route card */}
                {selectedResponder && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <RouteIcon className="h-3.5 w-3.5" />Rescue Route
                    </div>
                    <RouteCard
                      responder={selectedResponder}
                      routeResult={routeResult}
                      loading={routeLoading}
                      rescueScore={recommendedCandidate?.score}
                      isRecommended={decision?.recommendedResponderId === selectedResponderId}
                    />
                  </div>
                )}

                {/* Responders */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <Users className="h-3.5 w-3.5" />Nearby Responders
                    {candidates.length > 0 && (
                      <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{candidates.length} candidates</span>
                    )}
                  </div>
                  {candidates.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
                      <ListChecks className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No available responders match this incident</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {candidates.map((cand) => (
                        <ResponderCard
                          key={cand.responder.id}
                          responder={cand.responder}
                          candidate={cand}
                          selected={selectedResponderId === cand.responder.id}
                          onClick={() => setSelectedResponderId(selectedResponderId === cand.responder.id ? null : cand.responder.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Service centres */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <Building2 className="h-3.5 w-3.5" />Service Centres
                  </div>
                  <div className="space-y-2">
                    {demoServiceCentres.map((sc) => (
                      <div key={sc.id} className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900">{sc.name}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sc.open ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>{sc.open ? 'Open' : 'Closed'}</span>
                        </div>
                        <p className="text-xs text-gray-400">{sc.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

           {/* Decision Audit Modal */}
      {incident && decision && (
        <DecisionAudit
          open={auditOpen}
          onClose={() => setAuditOpen(false)}
          incident={incident}
          analysis={aiAnalysis}
          aiSource={aiSource}
          candidates={candidates}
          decision={decision}
          geoSource={metricsSource}
          routeResult={routeResult}
        />
      )}
    </div>
  );
}
