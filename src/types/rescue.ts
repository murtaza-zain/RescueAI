export type VehicleType = 'Sedan' | 'SUV' | 'Truck' | 'EV' | 'Motorcycle';

export type ProblemType =
  | 'Engine failure'
  | 'Flat tyre'
  | 'Battery failure'
  | 'Accident'
  | 'Overheating'
  | 'Fuel problem'
  | 'EV charging needed'
  | 'Other';

export type Situation =
  | 'Heavy rain'
  | 'Traffic congestion'
  | 'Unsafe roadside position'
  | 'Night-time'
  | 'Normal conditions';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export type IncidentStatus = 'reported' | 'dispatched' | 'en_route' | 'on_scene' | 'resolved';

export type ResponderStatus = 'available' | 'busy' | 'offline';

export type Capability =
  | 'roadside_assistance'
  | 'suv_towing'
  | 'sedan_towing'
  | 'battery_jump'
  | 'tyre_service'
  | 'ev_support'
  | 'accident_recovery';

// ── AI Incident Intelligence types (Phase 2) ──

export type AIIncidentType =
  | 'engine_failure'
  | 'flat_tyre'
  | 'battery_failure'
  | 'accident'
  | 'overheating'
  | 'fuel_problem'
  | 'ev_charging'
  | 'unknown';

export type AIVehicleType =
  | 'sedan'
  | 'suv'
  | 'truck'
  | 'ev'
  | 'motorcycle'
  | 'unknown';

export type AIUrgency = 'low' | 'medium' | 'high' | 'critical';

export type AIWeatherRisk = 'none' | 'low' | 'medium' | 'high';

export type AIRoadsideSafetyRisk = 'low' | 'medium' | 'high' | 'unknown';

export type AICapability =
  | 'roadside_assistance'
  | 'suv_towing'
  | 'sedan_towing'
  | 'truck_towing'
  | 'motorcycle_recovery'
  | 'battery_jump'
  | 'tyre_service'
  | 'ev_support'
  | 'accident_recovery'
  | 'fuel_delivery'
  | 'engine_diagnostics';

export interface AIIncidentAnalysis {
  incidentType: AIIncidentType;
  vehicleType: AIVehicleType;
  urgency: AIUrgency;
  requiresTowing: boolean;
  weatherRisk: AIWeatherRisk;
  roadsideSafetyRisk: AIRoadsideSafetyRisk;
  requiredCapabilities: AICapability[];
  detectedConditions: string[];
  confidence: number;
  shortSummary: string;
  explanation: string;
}

export const AI_CAPABILITY_LABELS: Record<AICapability, string> = {
  roadside_assistance: 'Roadside Assistance',
  suv_towing: 'SUV Towing',
  sedan_towing: 'Sedan Towing',
  truck_towing: 'Truck Towing',
  motorcycle_recovery: 'Motorcycle Recovery',
  battery_jump: 'Battery Jump',
  tyre_service: 'Tyre Service',
  ev_support: 'EV Support',
  accident_recovery: 'Accident Recovery',
  fuel_delivery: 'Fuel Delivery',
  engine_diagnostics: 'Engine Diagnostics',
};

export const AI_INCIDENT_TYPE_LABELS: Record<AIIncidentType, string> = {
  engine_failure: 'Engine Failure',
  flat_tyre: 'Flat Tyre',
  battery_failure: 'Battery Failure',
  accident: 'Accident',
  overheating: 'Overheating',
  fuel_problem: 'Fuel Problem',
  ev_charging: 'EV Charging',
  unknown: 'Unknown',
};

export const AI_VEHICLE_TYPE_LABELS: Record<AIVehicleType, string> = {
  sedan: 'Sedan',
  suv: 'SUV',
  truck: 'Truck',
  ev: 'EV',
  motorcycle: 'Motorcycle',
  unknown: 'Unknown',
};

export interface DemoScenario {
  id: string;
  label: string;
  text: string;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'engine',
    label: 'Engine Failure',
    text: 'My SUV stopped on Nguyen Van Linh. It won\'t start and it\'s raining heavily.',
  },
  {
    id: 'engine-vn',
    label: 'Engine Failure (VN)',
    text: 'Xe SUV của tôi bị chết máy trên đường Nguyễn Văn Linh, trời đang mưa lớn và xe đang dừng sát lề đường.',
  },
  {
    id: 'tyre',
    label: 'Flat Tyre',
    text: 'I have a flat tyre on my sedan and I\'m safely stopped on the roadside.',
  },
  {
    id: 'ev',
    label: 'EV Problem',
    text: 'My EV battery is almost empty and I need charging assistance.',
  },
  {
    id: 'accident',
    label: 'Accident',
    text: 'I was involved in a collision and my car is blocking part of the road.',
  },
];

export interface Incident {
  id: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  vehicleType: VehicleType;
  problemType: ProblemType;
  situation: Situation;
  priority: Priority;
  createdAt: string;
  status: IncidentStatus;
}

export interface Responder {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: ResponderStatus;
  capabilities: Capability[];
  supportedVehicleTypes: VehicleType[];
  currentEtaMinutes: number;
  serviceArea: string;
  available: boolean;
}

export interface ServiceCentre {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  services: Capability[];
  open: boolean;
  phone: string;
}

export interface ResponseRecommendation {
  responderId: string;
  etaMinutes: number;
  distanceKm: number;
  capabilityMatch: number;
  reasoning: string;
  score: number;
}

export type ViewName = 'dashboard' | 'incident' | 'operations';

export const VEHICLE_TYPES: VehicleType[] = ['Sedan', 'SUV', 'Truck', 'EV', 'Motorcycle'];
export const PROBLEM_TYPES: ProblemType[] = [
  'Engine failure',
  'Flat tyre',
  'Battery failure',
  'Accident',
  'Overheating',
  'Fuel problem',
  'EV charging needed',
  'Other',
];
export const SITUATIONS: Situation[] = [
  'Heavy rain',
  'Traffic congestion',
  'Unsafe roadside position',
  'Night-time',
  'Normal conditions',
];
export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];

export const CAPABILITY_LABELS: Record<Capability, string> = {
  roadside_assistance: 'Roadside Assistance',
  suv_towing: 'SUV Towing',
  sedan_towing: 'Sedan Towing',
  battery_jump: 'Battery Jump',
  tyre_service: 'Tyre Service',
  ev_support: 'EV Support',
  accident_recovery: 'Accident Recovery',
};

// ── Goong Geographic Intelligence types (Phase 3) ──

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeocodedLocation {
  inputAddress: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeId: string | null;
  resultQuality: string | null;
}

export interface RouteMetrics {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  distanceText: string;
  durationText: string;
}

export type GeoDataSource = 'goong' | 'fallback';

export interface ResponderRoute {
  responderId: string;
  origin: GeoPoint;
  destination: GeoPoint;
  metrics: RouteMetrics;
  encodedPolyline: string | null;
  routeAvailable: boolean;
  source: GeoDataSource;
}

export interface GoongRouteResult {
  status: 'ok' | 'fallback' | 'error';
  routes: ResponderRoute[];
  metrics: RouteMetrics | null;
  encodedPolyline: string | null;
  warnings: string[];
  source: GeoDataSource;
}

export type Compatibility = 'compatible' | 'partial' | 'incompatible';

export interface RescueScoreBreakdown {
  capabilityFit: number;
  responseTime: number;
  availability: number;
  totalScore: number;
}

export type Eligibility = 'eligible' | 'ineligible';

export interface CandidateResponse {
  responder: Responder;
  compatibility: Compatibility;
  eligibility: Eligibility;
  eligibilityReason: string;
  matchedCapabilities: Capability[];
  missingCapabilities: Capability[];
  distanceKm: number;
  durationMinutes: number;
  routeAvailable: boolean;
  source: GeoDataSource;
  score: number;
  breakdown: RescueScoreBreakdown;
  explanation: string;
}

export interface RescueDecision {
  incidentId: string;
  recommendedResponderId: string | null;
  recommendedResponder: Responder | null;
  score: number;
  confidence: number;
  candidates: CandidateResponse[];
  decisionReason: string;
  generatedAt: string;
  source: 'live' | 'demo';
}
