import type {
  GeoPoint,
  GeocodedLocation,
  RouteMetrics,
  ResponderRoute,
  GoongRouteResult,
} from '@/types/rescue';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateDurationMinutes(distanceKm: number): number {
  return Math.max(3, Math.round(distanceKm * 2.5) + 3);
}

// ── Fallback geocoding ──

const KNOWN_ADDRESSES: { match: string; lat: number; lng: number; formatted: string }[] = [
  { match: 'nguyen van linh', lat: 10.7279, lng: 106.7084, formatted: 'Nguyen Van Linh, Ho Chi Minh City, Vietnam' },
  { match: 'le loi', lat: 10.7735, lng: 106.7036, formatted: 'Le Loi Street, District 1, Ho Chi Minh City, Vietnam' },
  { match: 'vo van kiet', lat: 10.7535, lng: 106.6756, formatted: 'Vo Van Kiet Boulevard, District 5, Ho Chi Minh City, Vietnam' },
  { match: 'dien bien phu', lat: 10.805, lng: 106.7115, formatted: 'Dien Bien Phu Street, Binh Thanh, Ho Chi Minh City, Vietnam' },
];

export function fallbackGeocode(address: string): GeocodedLocation {
  const lower = address.toLowerCase();
  const known = KNOWN_ADDRESSES.find((a) => lower.includes(a.match));
  if (known) {
    return {
      inputAddress: address,
      formattedAddress: known.formatted,
      latitude: known.lat,
      longitude: known.lng,
      placeId: null,
      resultQuality: 'demo',
    };
  }
  return {
    inputAddress: address,
    formattedAddress: address,
    latitude: 10.7769,
    longitude: 106.7009,
    placeId: null,
    resultQuality: 'demo',
  };
}

// ── Fallback distance matrix ──

export function fallbackDistanceMatrix(
  origin: GeoPoint,
  destinations: GeoPoint[]
): RouteMetrics[] {
  return destinations.map((dest) => {
    const distanceKm = haversineKm(origin.lat, origin.lng, dest.lat, dest.lng);
    const durationMinutes = estimateDurationMinutes(distanceKm);
    return {
      distanceMeters: Math.round(distanceKm * 1000),
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationSeconds: durationMinutes * 60,
      durationMinutes,
      distanceText: `${distanceKm.toFixed(1)} km`,
      durationText: `${durationMinutes} min`,
    };
  });
}

// ── Fallback directions ──

export function fallbackDirections(
  origin: GeoPoint,
  destination: GeoPoint
): GoongRouteResult {
  const distanceKm = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const durationMinutes = estimateDurationMinutes(distanceKm);
  return {
    status: 'fallback',
    routes: [],
    metrics: {
      distanceMeters: Math.round(distanceKm * 1000),
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationSeconds: durationMinutes * 60,
      durationMinutes,
      distanceText: `${distanceKm.toFixed(1)} km`,
      durationText: `${durationMinutes} min`,
    },
    encodedPolyline: null,
    warnings: [],
    source: 'fallback',
  };
}

// ── Goong response normalizers ──

export function normalizeGeocode(goongData: unknown, inputAddress: string): GeocodedLocation | null {
  if (!goongData || typeof goongData !== 'object') return null;
  const results = (goongData as { results?: unknown[] }).results;
  if (!Array.isArray(results) || results.length === 0) return null;
  const first = results[0] as Record<string, unknown>;
  const geometry = first.geometry as { location?: { lat?: number; lng?: number } } | undefined;
  if (!geometry?.location?.lat || !geometry?.location?.lng) return null;
  return {
    inputAddress,
    formattedAddress: (first.formatted_address as string) || inputAddress,
    latitude: geometry.location.lat,
    longitude: geometry.location.lng,
    placeId: (first.place_id as string) || null,
    resultQuality: 'goong',
  };
}

export function normalizeDistanceMatrix(
  goongData: unknown,
  destinationCount: number
): RouteMetrics[] {
  const results: RouteMetrics[] = [];
  if (!goongData || typeof goongData !== 'object') {
    return Array(destinationCount).fill(null).map(() => emptyMetrics());
  }
  const rows = (goongData as { rows?: unknown[] }).rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return Array(destinationCount).fill(null).map(() => emptyMetrics());
  }
  const elements = (rows[0] as { elements?: unknown[] }).elements;
  if (!Array.isArray(elements)) {
    return Array(destinationCount).fill(null).map(() => emptyMetrics());
  }
  for (let i = 0; i < destinationCount; i++) {
    const el = elements[i] as { status?: string; distance?: { value?: number; text?: string }; duration?: { value?: number; text?: string } } | undefined;
    if (!el || el.status !== 'OK') {
      results.push(emptyMetrics());
      continue;
    }
    const distanceMeters = el.distance?.value ?? 0;
    const durationSeconds = el.duration?.value ?? 0;
    results.push({
      distanceMeters,
      distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
      durationSeconds,
      durationMinutes: Math.round(durationSeconds / 60),
      distanceText: el.distance?.text || `${(distanceMeters / 1000).toFixed(1)} km`,
      durationText: el.duration?.text || `${Math.round(durationSeconds / 60)} min`,
    });
  }
  return results;
}

function emptyMetrics(): RouteMetrics {
  return {
    distanceMeters: 0,
    distanceKm: 0,
    durationSeconds: 0,
    durationMinutes: 0,
    distanceText: '—',
    durationText: '—',
  };
}

export function normalizeDirections(
  goongData: unknown,
  origin: GeoPoint,
  destination: GeoPoint,
  responderId: string
): GoongRouteResult {
  if (!goongData || typeof goongData !== 'object') {
    return fallbackDirections(origin, destination);
  }
  const routes = (goongData as { routes?: unknown[] }).routes;
  if (!Array.isArray(routes) || routes.length === 0) {
    return fallbackDirections(origin, destination);
  }
  const route = routes[0] as {
    distance?: number;
    duration?: number;
    overview_polyline?: { points?: string };
    legs?: { distance?: { text?: string }; duration?: { text?: string }; steps?: unknown[] }[];
    warnings?: string[];
  };
  const distanceMeters = route.distance ?? 0;
  const durationSeconds = route.duration ?? 0;
  const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
  const durationMinutes = Math.round(durationSeconds / 60);
  const encodedPolyline = route.overview_polyline?.points ?? null;
  const warnings = Array.isArray(route.warnings) ? route.warnings.map((w) => String(w)) : [];
  const distanceText = route.legs?.[0]?.distance?.text || `${distanceKm.toFixed(1)} km`;
  const durationText = route.legs?.[0]?.duration?.text || `${durationMinutes} min`;

  const metrics: RouteMetrics = {
    distanceMeters,
    distanceKm,
    durationSeconds,
    durationMinutes,
    distanceText,
    durationText,
  };

  const responderRoute: ResponderRoute = {
    responderId,
    origin,
    destination,
    metrics,
    encodedPolyline,
    routeAvailable: true,
    source: 'goong',
  };

  return {
    status: 'ok',
    routes: [responderRoute],
    metrics,
    encodedPolyline,
    warnings,
    source: 'goong',
  };
}
