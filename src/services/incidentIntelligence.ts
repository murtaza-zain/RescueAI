import type {
  AIIncidentAnalysis,
  AIIncidentType,
  AIVehicleType,
  AIUrgency,
  AIWeatherRisk,
  AIRoadsideSafetyRisk,
  AICapability,
} from '@/types/rescue';
import { validateAIAnalysis } from './aiValidation';

export interface AnalyzeResult {
  analysis: AIIncidentAnalysis;
  source: 'openai' | 'fallback';
}

// ── Deterministic fallback ──

const INCIDENT_KEYWORDS: { type: AIIncidentType; words: string[] }[] = [
  { type: 'engine_failure', words: ["won't start", "doesn't start", 'engine', 'stalled', 'cut out', 'chết máy', 'khởi động', 'động cơ', 'không nổ máy'] },
  { type: 'flat_tyre', words: ['flat', 'puncture', 'tyre', 'tire', 'thủng lốp', 'xăm', 'lốp'] },
  { type: 'battery_failure', words: ['battery', 'dead battery', 'flat battery', 'hết ắc quy', 'pin yếu', 'ắc quy'] },
  { type: 'accident', words: ['crash', 'collision', 'accident', 'hit', 'va chạm', 'tai nạn', 'chạm'] },
  { type: 'overheating', words: ['overheating', 'hot engine', 'temperature', 'smoking', 'nóng máy', 'nhiệt độ'] },
  { type: 'fuel_problem', words: ['fuel', 'petrol', 'gas', 'diesel', 'empty tank', 'hết xăng', 'xăng', 'nhiên liệu'] },
  { type: 'ev_charging', words: ['charging', 'ev charger', 'battery low', 'out of charge', 'sạc', 'hết pin', 'trạm sạc', 'điện'] },
];

const VEHICLE_KEYWORDS: { type: AIVehicleType; words: string[] }[] = [
  { type: 'suv', words: ['suv'] },
  { type: 'sedan', words: ['sedan'] },
  { type: 'truck', words: ['truck', 'lorry', 'xe tải'] },
  { type: 'motorcycle', words: ['motorcycle', 'bike', 'scooter', 'xe máy'] },
  { type: 'ev', words: ['electric', 'ev', 'tesla', 'xe điện'] },
];

const WEATHER_KEYWORDS = ['rain', 'raining', 'storm', 'flooding', 'flood', 'heavy rain', 'downpour', 'mưa', 'mưa lớn', 'mưa to'];
const ROADSIDE_KEYWORDS = ['blocking', 'middle of the road', 'unsafe', 'traffic', 'fast lane', 'highway', 'chặn', 'lề đường', 'giữa đường', 'nguy hiểm'];

const CAPABILITY_MAP: Record<AIIncidentType, AICapability[]> = {
  engine_failure: ['roadside_assistance', 'engine_diagnostics'],
  flat_tyre: ['tyre_service'],
  battery_failure: ['battery_jump'],
  accident: ['accident_recovery', 'roadside_assistance'],
  overheating: ['roadside_assistance'],
  fuel_problem: ['fuel_delivery', 'roadside_assistance'],
  ev_charging: ['ev_support'],
  unknown: ['roadside_assistance'],
};

const TOWING_INCIDENTS: AIIncidentType[] = ['engine_failure', 'accident', 'overheating'];

const URGENCY_MAP: Record<AIIncidentType, AIUrgency> = {
  engine_failure: 'high',
  flat_tyre: 'medium',
  battery_failure: 'medium',
  accident: 'critical',
  overheating: 'high',
  fuel_problem: 'medium',
  ev_charging: 'medium',
  unknown: 'medium',
};

function matchKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function fallbackAnalyze(text: string): AIIncidentAnalysis {
  const lower = text.toLowerCase();

  let incidentType: AIIncidentType = 'unknown';
  for (const entry of INCIDENT_KEYWORDS) {
    if (matchKeywords(lower, entry.words)) {
      incidentType = entry.type;
      break;
    }
  }

  let vehicleType: AIVehicleType = 'unknown';
  for (const entry of VEHICLE_KEYWORDS) {
    if (matchKeywords(lower, entry.words)) {
      vehicleType = entry.type;
      break;
    }
  }

  const requiresTowing = TOWING_INCIDENTS.includes(incidentType);
  const requiredCapabilities = [...CAPABILITY_MAP[incidentType]];

  if (requiresTowing) {
    if (vehicleType === 'suv') requiredCapabilities.push('suv_towing');
    else if (vehicleType === 'sedan') requiredCapabilities.push('sedan_towing');
    else if (vehicleType === 'truck') requiredCapabilities.push('truck_towing');
    else if (vehicleType === 'motorcycle') requiredCapabilities.push('motorcycle_recovery');
    else requiredCapabilities.push('suv_towing');
  }

  const weatherRisk: AIWeatherRisk = matchKeywords(lower, WEATHER_KEYWORDS) ? 'high' : 'none';
  const roadsideSafetyRisk: AIRoadsideSafetyRisk = matchKeywords(lower, ROADSIDE_KEYWORDS)
    ? 'high'
    : 'low';

  let urgency = URGENCY_MAP[incidentType];
  if (roadsideSafetyRisk === 'high' && urgency === 'medium') urgency = 'high';
  if (roadsideSafetyRisk === 'high' && urgency === 'high') urgency = 'critical';

  const detectedConditions: string[] = [];
  if (matchKeywords(lower, WEATHER_KEYWORDS)) detectedConditions.push('heavy_rain');
  if (matchKeywords(lower, ['stopped', "won't start", 'stalled', 'disabled', 'dừng', 'đứng máy'])) detectedConditions.push('vehicle_disabled');
  if (matchKeywords(lower, ['roadside', 'side of the road', 'shoulder', 'pulled over', 'lề đường', 'sat lề'])) detectedConditions.push('roadside_stop');
  if (matchKeywords(lower, ['blocking', 'middle of the road', 'traffic', 'chặn', 'giữa đường'])) detectedConditions.push('blocking_traffic');
  if (matchKeywords(lower, ['night', 'dark', 'tối', 'ban đêm'])) detectedConditions.push('night_time');

  const uniqueCapabilities = [...new Set(requiredCapabilities)];

  const shortSummary = `${incidentType.replace('_', ' ')} incident${
    vehicleType !== 'unknown' ? ` involving a ${vehicleType}` : ''
  }${weatherRisk === 'high' ? ' in heavy rain' : ''}.`;

  const explanation = `Classified as ${incidentType.replace('_', ' ')} based on keyword matching. ` +
    `Urgency set to ${urgency}${roadsideSafetyRisk === 'high' ? ' due to high roadside risk' : ''}. ` +
    `Required capabilities: ${uniqueCapabilities.map((c) => c.replace('_', ' ')).join(', ')}.`;

  return {
    incidentType,
    vehicleType,
    urgency,
    requiresTowing,
    weatherRisk,
    roadsideSafetyRisk,
    requiredCapabilities: uniqueCapabilities,
    detectedConditions,
    confidence: 0.65,
    shortSummary,
    explanation,
  };
}

// ── OpenAI Edge Function call ──

async function callOpenAIEdgeFunction(text: string): Promise<AIIncidentAnalysis | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const url = `${supabaseUrl}/functions/v1/incident-intelligence`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ message: text }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.fallback) return null;

    return validateAIAnalysis(data.analysis);
  } catch {
    return null;
  }
}

export async function analyzeIncident(text: string): Promise<AnalyzeResult> {
  if (!text || !text.trim()) {
    return {
      analysis: fallbackAnalyze(''),
      source: 'fallback',
    };
  }

  const aiResult = await callOpenAIEdgeFunction(text);
  if (aiResult) {
    return { analysis: aiResult, source: 'openai' };
  }

  return {
    analysis: fallbackAnalyze(text),
    source: 'fallback',
  };
}
