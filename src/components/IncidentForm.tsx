import { useState } from 'react';
import { MapPin, Car, Wrench, CloudRain, Flag, Sparkles, Send, Brain, Loader2, Wand2, Navigation, CheckCircle2 } from 'lucide-react';
import type {
  VehicleType,
  ProblemType,
  Situation,
  Priority,
  Incident,
  AIIncidentAnalysis,
  AIVehicleType,
  AIIncidentType,
  AIUrgency,
  GeocodedLocation,
} from '@/types/rescue';
import {
  VEHICLE_TYPES,
  PROBLEM_TYPES,
  SITUATIONS,
  PRIORITIES,
  DEMO_SCENARIOS,
} from '@/types/rescue';
import { sampleIncident } from '@/data/demoIncidents';
import { analyzeIncident } from '@/services/incidentIntelligence';
import { geocodeAddress } from '@/services/goong';

interface IncidentFormProps {
  onSubmit: (incident: Omit<Incident, 'id' | 'createdAt' | 'status'>) => void;
  onAnalysis?: (analysis: AIIncidentAnalysis, source: 'openai' | 'fallback') => void;
  onGeocode?: (location: GeocodedLocation, source: 'goong' | 'fallback') => void;
}

const HCMC_CENTER: [number, number] = [10.7769, 106.7009];

const AI_VEHICLE_TO_UI: Record<AIVehicleType, VehicleType | ''> = {
  sedan: 'Sedan', suv: 'SUV', truck: 'Truck', ev: 'EV', motorcycle: 'Motorcycle', unknown: '',
};

const AI_INCIDENT_TO_UI: Record<AIIncidentType, ProblemType | ''> = {
  engine_failure: 'Engine failure', flat_tyre: 'Flat tyre', battery_failure: 'Battery failure',
  accident: 'Accident', overheating: 'Overheating', fuel_problem: 'Fuel problem',
  ev_charging: 'EV charging needed', unknown: '',
};

const AI_URGENCY_TO_UI: Record<AIUrgency, Priority> = {
  low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical',
};

function aiWeatherToSituation(weatherRisk: AIIncidentAnalysis['weatherRisk']): Situation | '' {
  if (weatherRisk === 'high' || weatherRisk === 'medium') return 'Heavy rain';
  return '';
}

export function IncidentForm({ onSubmit, onAnalysis, onGeocode }: IncidentFormProps) {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [geocoded, setGeocoded] = useState<GeocodedLocation | null>(null);
  const [geocodeSource, setGeocodeSource] = useState<'goong' | 'fallback' | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [problemType, setProblemType] = useState<ProblemType | ''>('');
  const [situation, setSituation] = useState<Situation | ''>('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');

  const canSubmit =
    location.trim() && vehicleType && problemType && situation && priority;

  function fillSample() {
    setDescription('My SUV stopped on Nguyen Van Linh. It won\'t start and it\'s raining heavily.');
    setLocation(sampleIncident.location);
    setVehicleType(sampleIncident.vehicleType);
    setProblemType(sampleIncident.problemType);
    setSituation(sampleIncident.situation);
    setPriority(sampleIncident.priority);
    setNotes(sampleIncident.description);
  }

  function loadScenario(text: string) {
    setDescription(text);
  }

  async function handleGeocode() {
    if (!location.trim()) return;
    setGeocoding(true);
    setGeocodeStatus('Locating incident...');
    try {
      const result = await geocodeAddress(location);
      setGeocoded(result.location);
      setGeocodeSource(result.source);
      setGeocodeStatus(result.source === 'goong' ? 'Location found' : 'Using demo location');
      onGeocode?.(result.location, result.source);
    } catch {
      setGeocodeStatus('Location unavailable — using demo');
      setGeocodeSource('fallback');
    } finally {
      setGeocoding(false);
    }
  }

  async function handleAnalyze() {
    if (!description.trim()) return;
    setAnalyzing(true);
    setAnalysisStatus('Understanding your incident...');
    try {
      const result = await analyzeIncident(description);
      const { analysis, source } = result;
      setAnalysisStatus('Incident understood');
      const shouldUpdate = analysis.confidence >= 0.5;
      if (shouldUpdate) {
        const aiVehicle = AI_VEHICLE_TO_UI[analysis.vehicleType];
        if (aiVehicle) setVehicleType(aiVehicle);
        const aiProblem = AI_INCIDENT_TO_UI[analysis.incidentType];
        if (aiProblem) setProblemType(aiProblem);
        setPriority(AI_URGENCY_TO_UI[analysis.urgency]);
        const aiSituation = aiWeatherToSituation(analysis.weatherRisk);
        if (aiSituation) setSituation(aiSituation);
      }
      onAnalysis?.(analysis, source);
    } catch {
      setAnalysisStatus('Analysis unavailable — using fallback');
    } finally {
      setAnalyzing(false);
    }
  }

  function handleSubmit() {
    if (!canSubmit || !vehicleType || !problemType || !situation) return;
    const lat = geocoded?.latitude ?? HCMC_CENTER[0];
    const lng = geocoded?.longitude ?? HCMC_CENTER[1];
    onSubmit({
      description: notes.trim() || description.trim() || `${problemType} — ${location}`,
      location: geocoded?.formattedAddress || location.trim(),
      latitude: lat,
      longitude: lng,
      vehicleType,
      problemType,
      situation,
      priority,
    });
  }

  const selectClass =
    'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Report Vehicle Incident</h2>
          <p className="text-xs text-gray-400 mt-0.5">Describe what happened or fill in the details below</p>
        </div>
        <button
          onClick={fillSample}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-100 hover:border-gray-300"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Use sample incident
        </button>
      </div>

      <div className="space-y-4">
        {/* Natural language description */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
            <Brain className="h-3.5 w-3.5" />
            Describe what happened
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="My SUV stopped on Nguyen Van Linh. It won't start and it's raining heavily."
            rows={3}
            className={`${selectClass} resize-none`}
          />
          <p className="text-[10px] text-gray-400 mt-1">Tell RescueAI what you're experiencing in your own words.</p>

          {/* Scenario launcher */}
          <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Try a Scenario</p>
            <div className="flex flex-wrap gap-2">
              {DEMO_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => loadScenario(scenario.text)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-900 hover:text-white"
                >
                  <Wand2 className="h-3 w-3" />
                  {scenario.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Use these deterministic scenarios for a reliable demo.</p>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!description.trim() || analyzing}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-100 disabled:bg-gray-50 disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{analysisStatus}</>
            ) : (
              <><Brain className="h-4 w-4" />{analysisStatus || 'Analyze Incident'}</>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-[10px] font-medium uppercase tracking-wider text-gray-300">Or fill manually</span>
          </div>
        </div>

        {/* Location with geocoding */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => { setLocation(e.target.value); setGeocoded(null); setGeocodeSource(null); setGeocodeStatus(''); }}
            placeholder="e.g. Nguyen Van Linh, Ho Chi Minh City"
            className={selectClass}
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleGeocode}
              disabled={!location.trim() || geocoding}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-100 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {geocoding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
              {geocoding ? 'Locating...' : 'Locate on map'}
            </button>
            {geocodeStatus && !geocoding && (
              <span className={`inline-flex items-center gap-1 text-xs ${geocodeSource === 'goong' ? 'text-emerald-600' : 'text-gray-400'}`}>
                <CheckCircle2 className="h-3 w-3" />
                {geocodeStatus}
              </span>
            )}
          </div>
          {geocoded && (
            <p className="text-[10px] text-gray-400 mt-1.5 truncate">
              {geocoded.formattedAddress}
            </p>
          )}
        </div>

        {/* Vehicle type */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
            <Car className="h-3.5 w-3.5" />
            Vehicle type
          </label>
          <div className="flex flex-wrap gap-2">
            {VEHICLE_TYPES.map((v) => (
              <button
                key={v}
                onClick={() => setVehicleType(v)}
                className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
                  vehicleType === v
                    ? 'border-blue-400 bg-blue-50 text-blue-600'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Problem type */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
            <Wrench className="h-3.5 w-3.5" />
            Problem type
          </label>
          <select
            value={problemType}
            onChange={(e) => setProblemType(e.target.value as ProblemType)}
            className={selectClass}
          >
            <option value="">Select a problem type…</option>
            {PROBLEM_TYPES.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>

        {/* Situation */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
            <CloudRain className="h-3.5 w-3.5" />
            Situation / conditions
          </label>
          <select
            value={situation}
            onChange={(e) => setSituation(e.target.value as Situation)}
            className={selectClass}
          >
            <option value="">Select conditions…</option>
            {SITUATIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
            <Flag className="h-3.5 w-3.5" />
            Priority
          </label>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
                  priority === p
                    ? p === 'Critical' ? 'border-red-400 bg-red-50 text-red-600'
                      : p === 'High' ? 'border-orange-400 bg-orange-50 text-orange-600'
                      : p === 'Medium' ? 'border-blue-400 bg-blue-50 text-blue-600'
                      : 'border-gray-300 bg-gray-50 text-gray-600'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Additional notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe the situation in more detail…"
            rows={2}
            className={`${selectClass} resize-none`}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          Report Incident
        </button>
      </div>
    </div>
  );
}
