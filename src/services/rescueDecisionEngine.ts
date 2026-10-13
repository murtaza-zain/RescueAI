import type {
  CandidateResponse,
  RescueScoreBreakdown,
  RescueDecision,
  Incident,
  AIIncidentAnalysis,
  Capability,
  GeoDataSource,
} from '@/types/rescue';
import { CAPABILITY_LABELS } from '@/types/rescue';

const WEIGHT_CAPABILITY = 0.50;
const WEIGHT_RESPONSE_TIME = 0.35;
const WEIGHT_AVAILABILITY = 0.15;

export function calculateRescueScore(
  candidate: CandidateResponse,
  allCandidates: CandidateResponse[]
): RescueScoreBreakdown {
  // Capability fit: matched / total required * 100
  const totalRequired = candidate.matchedCapabilities.length + candidate.missingCapabilities.length;
  const capabilityFit = totalRequired > 0
    ? (candidate.matchedCapabilities.length / totalRequired) * 100
    : 100;

  // Availability: available=100, else 0
  const availability = candidate.responder.available ? 100 : 0;

  // Response time: normalize relative to eligible candidates
  const eligible = allCandidates.filter((c) => c.eligibility === 'eligible');
  const eligibleDurations = eligible.map((c) => c.durationMinutes);
  const minDuration = eligibleDurations.length > 0 ? Math.min(...eligibleDurations) : 0;
  const maxDuration = eligibleDurations.length > 0 ? Math.max(...eligibleDurations) : 0;

  let responseTime: number;
  if (eligibleDurations.length === 0) {
    responseTime = 0;
  } else if (maxDuration === minDuration) {
    responseTime = 100;
  } else {
    responseTime = ((maxDuration - candidate.durationMinutes) / (maxDuration - minDuration)) * 100;
  }

  const totalScore =
    capabilityFit * WEIGHT_CAPABILITY +
    responseTime * WEIGHT_RESPONSE_TIME +
    availability * WEIGHT_AVAILABILITY;

  return {
    capabilityFit: Math.round(capabilityFit),
    responseTime: Math.round(responseTime),
    availability: Math.round(availability),
    totalScore: Math.round(totalScore),
  };
}

export function rankCandidates(candidates: CandidateResponse[]): CandidateResponse[] {
  return [...candidates].sort((a, b) => {
    // Eligible first
    if (a.eligibility !== b.eligibility) {
      return a.eligibility === 'eligible' ? -1 : 1;
    }
    // Then by score descending
    return b.score - a.score;
  });
}

export function selectRecommendedResponder(
  candidates: CandidateResponse[]
): CandidateResponse | null {
  const eligible = candidates.filter((c) => c.eligibility === 'eligible');
  if (eligible.length === 0) return null;
  return eligible.reduce((best, c) => (c.score > best.score ? c : best), eligible[0]);
}

export function generateDecisionExplanation(
  candidate: CandidateResponse
): string {
  const parts: string[] = [];

  parts.push(
    `${candidate.responder.name} is recommended because it is available`
  );

  if (candidate.matchedCapabilities.length > 0) {
    const capNames = candidate.matchedCapabilities
      .map((c) => CAPABILITY_LABELS[c] || c)
      .join(', ');
    parts.push(`supports ${capNames}`);
  }

  parts.push(`and has an estimated ${candidate.durationMinutes}-minute response`);

  return parts.join(', ') + '.';
}

export function generateIneligibilityReason(candidate: CandidateResponse): string {
  if (!candidate.responder.available) {
    return `${candidate.responder.name} is not available for dispatch.`;
  }
  if (candidate.missingCapabilities.length > 0) {
    const missing = candidate.missingCapabilities
      .map((c) => CAPABILITY_LABELS[c] || c)
      .join(', ');
    return `${candidate.responder.name} is missing required capability: ${missing}.`;
  }
  return `${candidate.responder.name} does not meet eligibility requirements.`;
}

export function generateClosestReason(
  candidates: CandidateResponse[],
  recommended: CandidateResponse | null
): { closest: CandidateResponse | null; reason: string } | null {
  const eligible = candidates.filter((c) => c.eligibility === 'eligible');
  if (eligible.length === 0 || !recommended) return null;

  const sorted = [...eligible].sort((a, b) => a.durationMinutes - b.durationMinutes);
  const closest = sorted[0];

  if (closest.responder.id === recommended.responder.id) return null;

  return {
    closest,
    reason: `${closest.responder.name} has a shorter estimated response time (${closest.durationMinutes} min), but ${recommended.responder.name} was selected because it has a higher overall Rescue Score.`,
  };
}

export function generateRescueDecision(
  incident: Incident,
  analysis: AIIncidentAnalysis | null,
  candidates: CandidateResponse[],
  geoSource: GeoDataSource,
  aiSource: 'openai' | 'fallback'
): RescueDecision {
  // Score all candidates
  const scored = candidates.map((c) => ({
    ...c,
    breakdown: calculateRescueScore(c, candidates),
  }));
  // Update score field from breakdown
  scored.forEach((c) => {
    c.score = c.breakdown.totalScore;
  });

  const ranked = rankCandidates(scored);
  const recommended = selectRecommendedResponder(scored);

  let decisionReason: string;
  if (recommended) {
    decisionReason = generateDecisionExplanation(recommended);
  } else {
    decisionReason =
      'No available responder in the current prototype dataset satisfies the incident\'s required capabilities.';
  }

  return {
    incidentId: incident.id,
    recommendedResponderId: recommended?.responder.id ?? null,
    recommendedResponder: recommended?.responder ?? null,
    score: recommended?.score ?? 0,
    confidence: analysis?.confidence ?? 0.65,
    candidates: ranked,
    decisionReason,
    generatedAt: new Date().toISOString(),
    source: geoSource === 'goong' && aiSource === 'openai' ? 'live' : 'demo',
  };
}

// ── Deterministic tests ──

export function runEngineTests(): { name: string; passed: boolean; detail: string }[] {
  const tests: { name: string; passed: boolean; detail: string }[] = [];

  const makeCandidate = (
    id: string,
    available: boolean,
    matched: Capability[],
    missing: Capability[],
    durationMinutes: number
  ): CandidateResponse => ({
    responder: {
      id, name: id, latitude: 0, longitude: 0,
      status: available ? 'available' : 'busy',
      capabilities: matched, supportedVehicleTypes: [],
      currentEtaMinutes: durationMinutes, serviceArea: '', available,
    },
    compatibility: missing.length === 0 ? 'compatible' : 'partial',
    eligibility: available && missing.length === 0 ? 'eligible' : 'ineligible',
    eligibilityReason: '',
    matchedCapabilities: matched,
    missingCapabilities: missing,
    distanceKm: 0,
    durationMinutes,
    routeAvailable: false,
    source: 'fallback',
    score: 0,
    breakdown: { capabilityFit: 0, responseTime: 0, availability: 0, totalScore: 0 },
    explanation: '',
  });

  // TEST A: Eligible responder with all capabilities
  {
    const c = makeCandidate('A', true, ['suv_towing', 'roadside_assistance'], [], 12);
    tests.push({
      name: 'TEST A: Eligible with all capabilities',
      passed: c.eligibility === 'eligible',
      detail: `eligibility=${c.eligibility}`,
    });
  }

  // TEST B: Missing required towing
  {
    const c = makeCandidate('B', true, ['tyre_service'], ['suv_towing'], 10);
    tests.push({
      name: 'TEST B: Missing towing capability',
      passed: c.eligibility === 'ineligible',
      detail: `eligibility=${c.eligibility}`,
    });
  }

  // TEST C: Two eligible, 10 and 20 min
  {
    const c1 = makeCandidate('C1', true, ['suv_towing'], [], 10);
    const c2 = makeCandidate('C2', true, ['suv_towing'], [], 20);
    const all = [c1, c2];
    const b1 = calculateRescueScore(c1, all);
    const b2 = calculateRescueScore(c2, all);
    tests.push({
      name: 'TEST C: 10min=100, 20min=0',
      passed: b1.responseTime === 100 && b2.responseTime === 0,
      detail: `10min=${b1.responseTime}, 20min=${b2.responseTime}`,
    });
  }

  // TEST D: Same ETA
  {
    const c1 = makeCandidate('D1', true, ['suv_towing'], [], 15);
    const c2 = makeCandidate('D2', true, ['suv_towing'], [], 15);
    const all = [c1, c2];
    const b1 = calculateRescueScore(c1, all);
    const b2 = calculateRescueScore(c2, all);
    tests.push({
      name: 'TEST D: Same ETA = 100',
      passed: b1.responseTime === 100 && b2.responseTime === 100,
      detail: `both=${b1.responseTime}`,
    });
  }

  // TEST E: Unavailable
  {
    const c = makeCandidate('E', false, ['suv_towing'], [], 8);
    tests.push({
      name: 'TEST E: Unavailable = ineligible',
      passed: c.eligibility === 'ineligible',
      detail: `eligibility=${c.eligibility}`,
    });
  }

  // TEST F: Perfect capabilities but unavailable
  {
    const c = makeCandidate('F', false, ['suv_towing', 'roadside_assistance'], [], 8);
    tests.push({
      name: 'TEST F: Perfect caps but unavailable',
      passed: c.eligibility === 'ineligible',
      detail: `eligibility=${c.eligibility}`,
    });
  }

  // TEST G: No eligible responders
  {
    const c1 = makeCandidate('G1', false, ['suv_towing'], [], 8);
    const c2 = makeCandidate('G2', true, [], ['suv_towing'], 12);
    const rec = selectRecommendedResponder([c1, c2]);
    tests.push({
      name: 'TEST G: No eligible = no recommendation',
      passed: rec === null,
      detail: `recommended=${rec?.responder.id ?? 'null'}`,
    });
  }

  return tests;
}
