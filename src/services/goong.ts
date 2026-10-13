const GOONG_JS_CDN = 'https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.1.0/dist/goong-js.js';
const GOONG_CSS_CDN = 'https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.1.0/dist/goong-js.css';

export const GOONG_STYLE_URLS = {
  light: 'https://tiles.goong.io/assets/goong_light_v2.json',
  web: 'https://tiles.goong.io/assets/goong_map_web.json',
  dark: 'https://tiles.goong.io/assets/goong_map_dark.json',
};

export function getGoongMapKey(): string | null {
  const key = import.meta.env.VITE_GOONG_MAP_KEY as string | undefined;
  if (key && key.trim().length > 0) return key.trim();
  return null;
}

export function isGoongConfigured(): boolean {
  return getGoongMapKey() !== null;
}

let goongScriptLoaded = false;
let goongScriptPromise: Promise<void> | null = null;

async function loadGoongScript(): Promise<void> {
  if (goongScriptLoaded) return;
  if (goongScriptPromise) return goongScriptPromise;

  goongScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('goong-js-script');
    if (existing) {
      existing.addEventListener('load', () => {
        goongScriptLoaded = true;
        resolve();
      });
      existing.addEventListener('error', () => reject(new Error('Failed to load Goong JS')));
      return;
    }

    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = GOONG_CSS_CDN;
    css.id = 'goong-js-css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = GOONG_JS_CDN;
    script.id = 'goong-js-script';
    script.async = true;
    script.onload = () => {
      goongScriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Goong JS from CDN'));
    document.head.appendChild(script);
  });

  return goongScriptPromise;
}

export interface GoongMapHandle {
  setCenter: (lng: number, lat: number) => void;
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  fitBounds: (bounds: [[number, number], [number, number]], padding?: number) => void;
  getZoom: () => number;
  remove: () => void;
  on: (event: string, handler: () => void) => void;
  addMarker: (lng: number, lat: number, element: HTMLElement) => unknown;
  removeMarker: (marker: unknown) => void;
  drawRoute: (encodedPolyline: string) => void;
  removeRoute: () => void;
}

export async function initGoongMap(
  container: HTMLElement,
  center: [number, number],
  zoom: number
): Promise<GoongMapHandle> {
  const key = getGoongMapKey();
  if (!key) throw new Error('Goong map key not configured');

  await loadGoongScript();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goongjs = (window as any).goongjs;
  if (!goongjs) throw new Error('Goong JS failed to initialize');

  goongjs.accessToken = key;

  const map = new goongjs.Map({
    container,
    style: GOONG_STYLE_URLS.light,
    center,
    zoom,
  });

  await new Promise<void>((resolve) => {
    map.on('load', () => resolve());
  });

  return {
    setCenter: (lng: number, lat: number) => map.setCenter([lng, lat]),
    flyTo: (lng: number, lat: number, zoomVal?: number) =>
      map.flyTo({ center: [lng, lat], zoom: zoomVal ?? zoom, duration: 1200 }),
    fitBounds: (bounds, padding = 60) =>
      map.fitBounds(bounds, { padding }),
    getZoom: () => map.getZoom(),
    remove: () => map.remove(),
    on: (event: string, handler: () => void) => map.on(event, handler),
    addMarker: (lng: number, lat: number, element: HTMLElement) =>
      new goongjs.Marker(element).setLngLat([lng, lat]).addTo(map),
    removeMarker: (marker: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (marker as any)?.remove?.();
    },
    drawRoute: (encodedPolyline: string) => {
      const coords = goongjs.decodePath?.(encodedPolyline) as [number, number][] | undefined;
      if (!coords || coords.length === 0) return;
      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coords.map((c) => [c[0], c[1]]),
        },
      };
      if (map.getSource('route-source')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map.getSource('route-source') as any).setData(geojson);
      } else {
        map.addSource('route-source', { type: 'geojson', data: geojson as unknown as { type: string; properties: unknown; geometry: { type: string; coordinates: [number, number][] } } });
        map.addLayer({
          id: 'route-layer',
          type: 'line',
          source: 'route-source',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#3b82f6', 'line-width': 4, 'line-opacity': 0.8 },
        });
      }
    },
    removeRoute: () => {
      if (map.getLayer('route-layer')) map.removeLayer('route-layer');
      if (map.getSource('route-source')) map.removeSource('route-source');
    },
  };
}

export interface GoongServiceAdapter {
  isConfigured: boolean;
  initMap: typeof initGoongMap;
  geocode: (address: string) => Promise<{ latitude: number; longitude: number } | null>;
  getDistance: (from: [number, number], to: [number, number]) => Promise<number | null>;
  getDirections: (from: [number, number], to: [number, number]) => Promise<unknown | null>;
}

export const goongService: GoongServiceAdapter = {
  isConfigured: isGoongConfigured(),
  initMap: initGoongMap,
  geocode: async (address: string) => {
    const key = getGoongMapKey();
    if (!key) return null;
    try {
      const url = `https://rsapi.goong.io/geocode?address=${encodeURIComponent(address)}&api_key=${key}`;
      const res = await fetch(url);
      const data = await res.json();
      const result = data?.results?.[0];
      if (result) {
        return { latitude: result.geometry.location.lat, longitude: result.geometry.location.lng };
      }
      return null;
    } catch {
      return null;
    }
  },
  getDistance: async (from: [number, number], to: [number, number]) => {
    const key = getGoongMapKey();
    if (!key) return null;
    try {
      const origins = `${from[1]},${from[0]}`;
      const destinations = `${to[1]},${to[0]}`;
      const url = `https://rsapi.goong.io/distancematrix?origins=${origins}&destinations=${destinations}&vehicle=car&api_key=${key}`;
      const res = await fetch(url);
      const data = await res.json();
      const rows = data?.rows?.[0]?.elements?.[0];
      if (rows?.distance?.value) return rows.distance.value / 1000;
      return null;
    } catch {
      return null;
    }
  },
  getDirections: async (from: [number, number], to: [number, number]) => {
    const key = getGoongMapKey();
    if (!key) return null;
    try {
      const origin = `${from[1]},${from[0]}`;
      const destination = `${to[1]},${to[0]}`;
      const url = `https://rsapi.goong.io/direction?origin=${origin}&destination=${destination}&vehicle=car&api_key=${key}`;
      const res = await fetch(url);
      return await res.json();
    } catch {
      return null;
    }
  },
};

// ── Phase 3: Server-side Goong REST API via edge function ──

import type {
  GeoPoint,
  GeocodedLocation,
  RouteMetrics,
  GoongRouteResult,
} from '@/types/rescue';
import {
  fallbackGeocode,
  fallbackDistanceMatrix,
  fallbackDirections,
  normalizeGeocode,
  normalizeDistanceMatrix,
  normalizeDirections,
} from './goongNormalizers';

async function callGoongEdgeFunction(operation: string, params: Record<string, string>): Promise<{ data: unknown } | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const url = `${supabaseUrl}/functions/v1/goong-routing`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ operation, params }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.fallback || !json.data) return null;
    return { data: json.data };
  } catch {
    return null;
  }
}

export async function geocodeAddress(address: string): Promise<{ location: GeocodedLocation; source: 'goong' | 'fallback' }> {
  if (!address.trim()) {
    return { location: fallbackGeocode(address), source: 'fallback' };
  }
  const result = await callGoongEdgeFunction('geocode', { address });
  if (result) {
    const normalized = normalizeGeocode(result.data, address);
    if (normalized) return { location: normalized, source: 'goong' };
  }
  return { location: fallbackGeocode(address), source: 'fallback' };
}

export async function getDistanceMatrix(
  origin: GeoPoint,
  destinations: GeoPoint[]
): Promise<{ metrics: RouteMetrics[]; source: 'goong' | 'fallback' }> {
  if (destinations.length === 0) return { metrics: [], source: 'fallback' };
  const originsStr = `${origin.lat},${origin.lng}`;
  const destinationsStr = destinations.map((d) => `${d.lat},${d.lng}`).join('|');

  const result = await callGoongEdgeFunction('distanceMatrix', {
    origins: originsStr,
    destinations: destinationsStr,
    vehicle: 'car',
  });

  if (result) {
    const metrics = normalizeDistanceMatrix(result.data, destinations.length);
    if (metrics.some((m) => m.distanceMeters > 0)) {
      return { metrics, source: 'goong' };
    }
  }
  return { metrics: fallbackDistanceMatrix(origin, destinations), source: 'fallback' };
}

export async function getDirections(
  origin: GeoPoint,
  destination: GeoPoint,
  responderId: string
): Promise<GoongRouteResult> {
  const originStr = `${origin.lat},${origin.lng}`;
  const destStr = `${destination.lat},${destination.lng}`;

  const result = await callGoongEdgeFunction('directions', {
    origin: originStr,
    destination: destStr,
    vehicle: 'car',
  });

  if (result) {
    return normalizeDirections(result.data, origin, destination, responderId);
  }
  return fallbackDirections(origin, destination);
}
