import type {
  Incident,
  Responder,
  ResponseRecommendation,
  Capability,
  AICapability,
  AIIncidentAnalysis,
  RouteMetrics,
  Compatibility,
  CandidateResponse,
  GeoDataSource,
  Eligibility,
} from '@/types/rescue';
import { demoResponders } from '@/data/demoResponders';
import { demoServiceCentres } from '@/data/demoServiceCentres';
import { demoIncidents } from '@/data/demoIncidents';

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function capabilityForProblem(problemType: Incident['problemType']): Capability[] {
  const map: Record<Incident['problemType'], Capability[]> = {
    'Engine failure': ['roadside_assistance', 'sedan_towing', 'suv_towing'],
    'Flat tyre': ['tyre_service'],
    'Battery failure': ['battery_jump'],
    Accident: ['accident_recovery', 'roadside_assistance'],
    Overheating: ['roadside_assistance'],
    'Fuel problem': ['roadside_assistance'],
    'EV charging needed': ['ev_support'],
    Other: ['roadside_assistance'],
  };
  return map[problemType] ?? ['roadside_assistance'];
}

export function generateRecommendations(
  incident: Incident,
  responders: Responder[]
): ResponseRecommendation[] {
  const needed = capabilityForProblem(incident.problemType);
  const recommendations: ResponseRecommendation[] = [];

  for (const r of responders) {
    if (!r.available) continue;

    const distanceKm = haversineKm(
      incident.latitude,
      incident.longitude,
      r.latitude,
      r.longitude
    );

    const matchedCapabilities = needed.filter((c) => r.capabilities.includes(c));
    const capabilityMatch = matchedCapabilities.length / needed.length;

    const vehicleSupported = r.supportedVehicleTypes.includes(incident.vehicleType);

    const etaMinutes = Math.max(3, Math.round(distanceKm * 2.5) + 3);

    const reasoningParts: string[] = [];
    if (capabilityMatch === 1) {
      reasoningParts.push('Full capability match for this problem type');
    } else if (capabilityMatch > 0) {
      reasoningParts.push(`Partial capability match (${matchedCapabilities.length}/${needed.length})`);
    } else {
      reasoningParts.push('No direct capability match');
    }

    if (vehicleSupported) {
      reasoningParts.push(`Supports ${incident.vehicleType} vehicles`);
    } else {
      reasoningParts.push(`Does not support ${incident.vehicleType}`);
    }

    reasoningParts.push(`${distanceKm.toFixed(1)} km away in ${r.serviceArea}`);

    if (!r.available) {
      reasoningParts.push('Currently busy');
    }

    const distanceScore = Math.max(0, 1 - distanceKm / 30);
    const etaScore = Math.max(0, 1 - etaMinutes / 40);
    const score =
      capabilityMatch * 0.4 +
      (vehicleSupported ? 0.2 : 0) +
      distanceScore * 0.2 +
      etaScore * 0.2;

    recommendations.push({
      responderId: r.id,
      etaMinutes,
      distanceKm: Math.round(distanceKm * 10) / 10,
      capabilityMatch: Math.round(capabilityMatch * 100) / 100,
      reasoning: reasoningParts.join('. '),
      score: Math.round(score * 100) / 100,
    });
  }

  return recommendations.sort((a, b) => b.score - a.score);
}

const AI_CAPABILITY_TO_RESPONDER: Record<AICapability, Capability | null> = {
  roadside_assistance: 'roadside_assistance',
  suv_towing: 'suv_towing',
  sedan_towing: 'sedan_towing',
  truck_towing: null,
  motorcycle_recovery: null,
  battery_jump: 'battery_jump',
  tyre_service: 'tyre_service',
  ev_support: 'ev_support',
  accident_recovery: 'accident_recovery',
  fuel_delivery: null,
  engine_diagnostics: null,
};

export function generateRecommendationsFromAI(
  analysis: AIIncidentAnalysis,
  incident: Incident,
  responders: Responder[]
): ResponseRecommendation[] {
  const neededAI = analysis.requiredCapabilities;
  const neededResponder = neededAI
    .map((c) => AI_CAPABILITY_TO_RESPONDER[c])
    .filter((c): c is Capability => c !== null);

  const needed = neededResponder.length > 0 ? neededResponder : capabilityForProblem(incident.problemType);

  const recommendations: ResponseRecommendation[] = [];

  for (const r of responders) {
    if (!r.available) continue;

    const distanceKm = haversineKm(
      incident.latitude,
      incident.longitude,
      r.latitude,
      r.longitude
    );

    const matchedCapabilities = needed.filter((c) => r.capabilities.includes(c));
    const capabilityMatch = needed.length > 0 ? matchedCapabilities.length / needed.length : 0;

    const vehicleSupported = r.supportedVehicleTypes.includes(incident.vehicleType);

    const etaMinutes = Math.max(3, Math.round(distanceKm * 2.5) + 3);

    const reasoningParts: string[] = [];
    if (capabilityMatch === 1) {
      reasoningParts.push('Full AI capability match');
    } else if (capabilityMatch > 0) {
      reasoningParts.push(`Partial AI capability match (${matchedCapabilities.length}/${needed.length})`);
    } else {
      reasoningParts.push('No AI capability match');
    }

    if (vehicleSupported) {
      reasoningParts.push(`Supports ${incident.vehicleType} vehicles`);
    } else {
      reasoningParts.push(`Does not support ${incident.vehicleType}`);
    }

    reasoningParts.push(`${distanceKm.toFixed(1)} km away in ${r.serviceArea}`);

    const distanceScore = Math.max(0, 1 - distanceKm / 30);
    const etaScore = Math.max(0, 1 - etaMinutes / 40);
    const score =
      capabilityMatch * 0.4 +
      (vehicleSupported ? 0.2 : 0) +
      distanceScore * 0.2 +
      etaScore * 0.2;

    recommendations.push({
      responderId: r.id,
      etaMinutes,
      distanceKm: Math.round(distanceKm * 10) / 10,
      capabilityMatch: Math.round(capabilityMatch * 100) / 100,
      reasoning: reasoningParts.join('. '),
      score: Math.round(score * 100) / 100,
    });
  }

  return recommendations.sort((a, b) => b.score - a.score);
}

export const rescueData = {
  getResponders: (): Responder[] => [...demoResponders],

  getServiceCentres: () => [...demoServiceCentres],

  getIncidents: (): Incident[] => [...demoIncidents],

  getResponderById: (id: string): Responder | undefined =>
    demoResponders.find((r) => r.id === id),

  getRecommendations: (incident: Incident): ResponseRecommendation[] =>
    generateRecommendations(incident, demoResponders),

  getRecommendationsFromAI: (
    analysis: AIIncidentAnalysis,
    incident: Incident
  ): ResponseRecommendation[] =>
    generateRecommendationsFromAI(analysis, incident, demoResponders),

  getActiveIncidents: (): Incident[] =>
    demoIncidents.filter((i) => i.status !== 'resolved'),

  getAvailableUnits: (): Responder[] => demoResponders.filter((r) => r.available),

  getAverageEta: (): number => {
    const available = demoResponders.filter((r) => r.available);
    if (available.length === 0) return 0;
    return Math.round(
      available.reduce((sum, r) => sum + r.currentEtaMinutes, 0) / available.length
    );
  },

  getHighPriorityIncidents: (): Incident[] =>
    demoIncidents.filter((i) => i.priority === 'High' || i.priority === 'Critical'),

  getIncidentTypeBreakdown: (): Record<string, number> => {
    const breakdown: Record<string, number> = {};
    for (const inc of demoIncidents) {
      breakdown[inc.problemType] = (breakdown[inc.problemType] ?? 0) + 1;
    }
    return breakdown;
  },
};

// ── Phase 3: Candidate response builder ──

export function buildCandidateResponses(
  incident: Incident,
  analysis: AIIncidentAnalysis | null,
  responders: Responder[],
  routeMetrics: RouteMetrics[] | null,
  geoSource: GeoDataSource
): CandidateResponse[] {
  const neededAI = analysis?.requiredCapabilities ?? [];
  const neededResponder = neededAI
    .map((c) => AI_CAPABILITY_TO_RESPONDER[c])
    .filter((c): c is Capability => c !== null);

  const needed = neededResponder.length > 0
    ? neededResponder
    : capabilityForProblem(incident.problemType);

  const candidates: CandidateResponse[] = [];

  for (let i = 0; i < responders.length; i++) {
    const r = responders[i];

    const matched = needed.filter((c) => r.capabilities.includes(c));
    const missing = needed.filter((c) => !r.capabilities.includes(c));
    const vehicleSupported = r.supportedVehicleTypes.includes(incident.vehicleType);

    let compatibility: Compatibility;
    if (matched.length === needed.length && vehicleSupported) {
      compatibility = 'compatible';
    } else if (matched.length > 0 || vehicleSupported) {
      compatibility = 'partial';
    } else {
      compatibility = 'incompatible';
    }

    // Hard eligibility filter
    let eligibility: Eligibility = 'eligible';
    let eligibilityReason = '';
    if (!r.available) {
      eligibility = 'ineligible';
      eligibilityReason = 'Responder is not available for dispatch';
    } else if (missing.length > 0) {
      eligibility = 'ineligible';
      eligibilityReason = `Missing: ${missing.map((c) => c.replace(/_/g, ' ')).join(', ')}`;
    }

    const metrics = routeMetrics?.[i] ?? null;
    const distanceKm = metrics
      ? metrics.distanceKm
      : Math.round(haversineKm(incident.latitude, incident.longitude, r.latitude, r.longitude) * 10) / 10;
    const durationMinutes = metrics
      ? metrics.durationMinutes
      : Math.max(3, Math.round(distanceKm * 2.5) + 3);

    candidates.push({
      responder: r,
      compatibility,
      eligibility,
      eligibilityReason,
      matchedCapabilities: matched,
      missingCapabilities: missing,
      distanceKm,
      durationMinutes,
      routeAvailable: metrics ? metrics.distanceMeters > 0 : false,
      source: geoSource,
      score: 0,
      breakdown: { capabilityFit: 0, responseTime: 0, availability: 0, totalScore: 0 },
      explanation: '',
    });
  }

  return candidates;
}
