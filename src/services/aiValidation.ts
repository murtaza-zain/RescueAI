import type {
  AIIncidentAnalysis,
  AIIncidentType,
  AIVehicleType,
  AIUrgency,
  AIWeatherRisk,
  AIRoadsideSafetyRisk,
  AICapability,
} from '@/types/rescue';

const VALID_INCIDENT_TYPES: AIIncidentType[] = [
  'engine_failure', 'flat_tyre', 'battery_failure', 'accident',
  'overheating', 'fuel_problem', 'ev_charging', 'unknown',
];
const VALID_VEHICLE_TYPES: AIVehicleType[] = [
  'sedan', 'suv', 'truck', 'ev', 'motorcycle', 'unknown',
];
const VALID_URGENCIES: AIUrgency[] = ['low', 'medium', 'high', 'critical'];
const VALID_WEATHER: AIWeatherRisk[] = ['none', 'low', 'medium', 'high'];
const VALID_ROADSIDE: AIRoadsideSafetyRisk[] = ['low', 'medium', 'high', 'unknown'];
const VALID_CAPABILITIES: AICapability[] = [
  'roadside_assistance', 'suv_towing', 'sedan_towing', 'truck_towing',
  'motorcycle_recovery', 'battery_jump', 'tyre_service', 'ev_support',
  'accident_recovery', 'fuel_delivery', 'engine_diagnostics',
];

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function clampConfidence(v: unknown): number {
  const n = typeof v === 'number' ? v : 0;
  return Math.max(0, Math.min(1, n));
}

export function validateAIAnalysis(raw: unknown): AIIncidentAnalysis | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const incidentType = VALID_INCIDENT_TYPES.includes(obj.incidentType as AIIncidentType)
    ? (obj.incidentType as AIIncidentType)
    : 'unknown';

  const vehicleType = VALID_VEHICLE_TYPES.includes(obj.vehicleType as AIVehicleType)
    ? (obj.vehicleType as AIVehicleType)
    : 'unknown';

  const urgency = VALID_URGENCIES.includes(obj.urgency as AIUrgency)
    ? (obj.urgency as AIUrgency)
    : 'medium';

  const requiresTowing = typeof obj.requiresTowing === 'boolean' ? obj.requiresTowing : false;

  const weatherRisk = VALID_WEATHER.includes(obj.weatherRisk as AIWeatherRisk)
    ? (obj.weatherRisk as AIWeatherRisk)
    : 'none';

  const roadsideSafetyRisk = VALID_ROADSIDE.includes(obj.roadsideSafetyRisk as AIRoadsideSafetyRisk)
    ? (obj.roadsideSafetyRisk as AIRoadsideSafetyRisk)
    : 'unknown';

  const requiredCapabilities = Array.isArray(obj.requiredCapabilities)
    ? (obj.requiredCapabilities as unknown[]).filter((c): c is AICapability =>
        VALID_CAPABILITIES.includes(c as AICapability))
    : [];

  const detectedConditions = Array.isArray(obj.detectedConditions)
    ? (obj.detectedConditions as unknown[]).filter(isString)
    : [];

  const confidence = clampConfidence(obj.confidence);

  const shortSummary = isString(obj.shortSummary) ? obj.shortSummary : '';
  const explanation = isString(obj.explanation) ? obj.explanation : '';

  return {
    incidentType,
    vehicleType,
    urgency,
    requiresTowing,
    weatherRisk,
    roadsideSafetyRisk,
    requiredCapabilities,
    detectedConditions,
    confidence,
    shortSummary,
    explanation,
  };
}
