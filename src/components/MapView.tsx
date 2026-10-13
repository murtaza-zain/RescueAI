import { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { goongService, isGoongConfigured, type GoongMapHandle } from '@/services/goong';
import type { Incident, Responder, ServiceCentre, GeoPoint, CandidateResponse } from '@/types/rescue';
import { MapLegend } from './MapLegend';
import { ResponseMapPanel } from './ResponseMapPanel';

interface MapViewProps {
  incident?: Incident | null;
  responders: Responder[];
  serviceCentres: ServiceCentre[];
  onResponderClick?: (responder: Responder) => void;
  selectedResponderId?: string | null;
  routePolyline?: string | null;
  routeOrigin?: GeoPoint | null;
  routeDestination?: GeoPoint | null;
  candidates?: CandidateResponse[];
  recommendedId?: string | null;
}

type MapState = 'loading' | 'ready' | 'fallback' | 'error';

export function MapView({
  incident,
  responders,
  serviceCentres,
  onResponderClick,
  selectedResponderId,
  routePolyline,
  routeOrigin,
  routeDestination,
  candidates,
  recommendedId,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement>(null);
  const [mapState, setMapState] = useState<MapState>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const mapHandleRef = useRef<GoongMapHandle | null>(null);
  const markersRef = useRef<unknown[]>([]);

  const candidateMap = new Map<string, CandidateResponse>();
  if (candidates) {
    for (const c of candidates) candidateMap.set(c.responder.id, c);
  }

  const recommendedCount = recommendedId ? 1 : 0;
  const eligibleCount = candidates
    ? candidates.filter((c) => c.eligibility === 'eligible' && c.responder.id !== recommendedId).length
    : 0;
  const ineligibleCount = candidates
    ? candidates.filter((c) => c.eligibility === 'ineligible').length
    : 0;

  // Goong map initialization
  useEffect(() => {
    if (!isGoongConfigured()) {
      setMapState('fallback');
      return;
    }
    let cancelled = false;
    setMapState('loading');
    goongService
      .initMap(containerRef.current!, [106.7009, 10.7769], 12)
      .then((handle) => {
        if (cancelled) { handle.remove(); return; }
        mapHandleRef.current = handle;
        setMapState('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : 'Map failed to load');
        setMapState('error');
      });
    return () => {
      cancelled = true;
      if (mapHandleRef.current) { mapHandleRef.current.remove(); mapHandleRef.current = null; }
    };
  }, []);

  // Update markers + route when data changes (Goong mode)
  useEffect(() => {
    const handle = mapHandleRef.current;
    if (!handle || mapState !== 'ready') return;

    for (const m of markersRef.current) { handle.removeMarker(m); }
    markersRef.current = [];

    // Incident marker — prominent
    if (incident) {
      const el = document.createElement('div');
      el.innerHTML = `<div style="width:24px;height:24px;border-radius:50%;background:#ef4444;border:3px solid #fff;box-shadow:0 0 0 6px rgba(239,68,68,0.3);"></div>`;
      const marker = handle.addMarker(incident.longitude, incident.latitude, el);
      markersRef.current.push(marker);
    }

    // Responder markers — differentiated by eligibility
    for (const r of responders) {
      const el = document.createElement('div');
      el.style.cursor = 'pointer';
      const isSelected = selectedResponderId === r.id;
      const cand = candidateMap.get(r.id);
      const isRecommended = recommendedId === r.id;
      const isEligible = cand?.eligibility === 'eligible';
      const isDimmed = selectedResponderId && !isSelected && !isRecommended;

      let color: string;
      let size: number;
      let opacity = '1';

      if (isRecommended) {
        color = '#111827';
        size = 20;
      } else if (isEligible) {
        color = '#10b981';
        size = 16;
      } else {
        color = '#d1d5db';
        size = 12;
        opacity = '0.5';
      }

      if (isDimmed) opacity = '0.35';

      const ring = isRecommended ? 'outline:3px solid #3b82f6;' : isSelected ? 'outline:2px solid #3b82f6;' : '';
      el.innerHTML = `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 3px ${color}40;opacity:${opacity};${ring}"></div>`;
      el.addEventListener('click', () => onResponderClick?.(r));
      const marker = handle.addMarker(r.longitude, r.latitude, el);
      markersRef.current.push(marker);
    }

    // Service centre markers — distinct square shape
    for (const sc of serviceCentres) {
      const el = document.createElement('div');
      el.innerHTML = `<div style="width:16px;height:16px;border-radius:3px;background:#6366f1;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.2);"></div>`;
      const marker = handle.addMarker(sc.longitude, sc.latitude, el);
      markersRef.current.push(marker);
    }

    // Draw route polyline
    if (routePolyline && routeOrigin && routeDestination) {
      handle.drawRoute(routePolyline);
      handle.fitBounds(
        [[routeOrigin.lng, routeOrigin.lat], [routeDestination.lng, routeDestination.lat]],
        80
      );
    } else {
      handle.removeRoute();
      if (incident) {
        handle.flyTo(incident.longitude, incident.latitude, 13);
      }
    }
  }, [incident, responders, serviceCentres, mapState, onResponderClick, selectedResponderId, routePolyline, routeOrigin, routeDestination, candidates, recommendedId]);

  // Fallback canvas map
  const drawFallbackMap = useCallback(() => {
    const canvas = fallbackCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    const grid = 40;
    for (let x = 0; x < w; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    const minLng = 106.62, maxLng = 106.78, minLat = 10.7, maxLat = 10.87;
    const project = (lng: number, lat: number): [number, number] => {
      const x = ((lng - minLng) / (maxLng - minLng)) * w;
      const y = h - ((lat - minLat) / (maxLat - minLat)) * h;
      return [x, y];
    };

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    const roads: [[number, number], [number, number]][] = [
      [[106.65, 10.78], [106.76, 10.78]], [[106.70, 10.72], [106.70, 10.84]],
      [[106.73, 10.74], [106.75, 10.82]], [[106.68, 10.80], [106.74, 10.73]],
    ];
    for (const [[x1, y1], [x2, y2]] of roads) {
      const [px1, py1] = project(x1, y1); const [px2, py2] = project(x2, y2);
      ctx.beginPath(); ctx.moveTo(px1, py1); ctx.lineTo(px2, py2); ctx.stroke();
    }

    // Service centres — indigo squares
    for (const sc of serviceCentres) {
      const [x, y] = project(sc.longitude, sc.latitude);
      ctx.fillStyle = sc.open ? '#6366f1' : '#a5b4fc';
      ctx.fillRect(x - 7, y - 7, 14, 14);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x - 7, y - 7, 14, 14);
    }

    // Responders — differentiated by eligibility
    for (const r of responders) {
      const [x, y] = project(r.longitude, r.latitude);
      const isSelected = selectedResponderId === r.id;
      const cand = candidateMap.get(r.id);
      const isRecommended = recommendedId === r.id;
      const isEligible = cand?.eligibility === 'eligible';
      const isDimmed = selectedResponderId && !isSelected && !isRecommended;

      ctx.globalAlpha = isDimmed ? 0.25 : isEligible || isRecommended ? 1 : 0.4;

      const radius = isRecommended ? 10 : isEligible ? 7 : 5;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);

      if (isRecommended) ctx.fillStyle = '#111827';
      else if (isEligible) ctx.fillStyle = '#10b981';
      else ctx.fillStyle = '#d1d5db';
      ctx.fill();

      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

      if (isRecommended || isSelected) {
        ctx.beginPath(); ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Route line
    if (routeOrigin && routeDestination) {
      const [x1, y1] = project(routeOrigin.lng, routeOrigin.lat);
      const [x2, y2] = project(routeDestination.lng, routeDestination.lat);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Incident — prominent
    if (incident) {
      const [x, y] = project(incident.longitude, incident.latitude);
      ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(239,68,68,0.3)'; ctx.lineWidth = 4; ctx.stroke();
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '11px -apple-system, system-ui, sans-serif';
    ctx.fillText('Ho Chi Minh City — Prototype Map View', 12, 20);
  }, [incident, responders, serviceCentres, selectedResponderId, routeOrigin, routeDestination, candidates, recommendedId]);

  useEffect(() => {
    if (mapState !== 'fallback') return;
    drawFallbackMap();
  }, [mapState, incident, responders, serviceCentres, selectedResponderId, routeOrigin, routeDestination, drawFallbackMap]);

  if (mapState === 'error') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-50 rounded-2xl border border-gray-200">
        <div className="text-center max-w-sm px-6">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">Map unavailable</p>
          <p className="text-xs text-gray-400">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
      <div ref={containerRef} className="absolute inset-0" style={{ display: mapState === 'ready' ? 'block' : 'none' }} />
      {mapState === 'fallback' && (
        <div className="absolute inset-0">
          <canvas ref={fallbackCanvasRef} className="h-full w-full" onClick={drawFallbackMap} />
          <div className="absolute top-4 right-4 rounded-lg bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm px-3 py-2">
            <p className="text-xs font-medium text-gray-600">Prototype map — add a Goong API key for live maps</p>
          </div>
        </div>
      )}
      {mapState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
            <p className="text-xs text-gray-400">Loading map…</p>
          </div>
        </div>
      )}
      {candidates && candidates.length > 0 && (
        <ResponseMapPanel
          recommendedCount={recommendedCount}
          eligibleCount={eligibleCount}
          ineligibleCount={ineligibleCount}
          hasSelection={!!selectedResponderId}
        />
      )}
      <MapLegend />
    </div>
  );
}
