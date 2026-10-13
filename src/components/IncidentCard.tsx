import { MapPin, Car, AlertTriangle, CloudRain, Flag, Clock } from 'lucide-react';
import type { Incident, Priority } from '@/types/rescue';

interface IncidentCardProps {
  incident: Incident;
  compact?: boolean;
}

const priorityColors: Record<Priority, string> = {
  Low: 'bg-gray-100 text-gray-600 border-gray-200',
  Medium: 'bg-blue-50 text-blue-600 border-blue-200',
  High: 'bg-orange-50 text-orange-600 border-orange-200',
  Critical: 'bg-red-50 text-red-600 border-red-200',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

export function IncidentCard({ incident, compact = false }: IncidentCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {incident.problemType}
            </p>
            <p className="text-xs text-gray-400">{incident.id}</p>
          </div>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${priorityColors[incident.priority]}`}
        >
          {incident.priority}
        </span>
      </div>

      {!compact && (
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
          {incident.description}
        </p>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />
          <span className="truncate">{incident.location}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Car className="h-3.5 w-3.5 text-gray-400" />
          <span>{incident.vehicleType}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CloudRain className="h-3.5 w-3.5 text-gray-400" />
          <span>{incident.situation}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Flag className="h-3.5 w-3.5 text-gray-400" />
            <span className="capitalize">{incident.status.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{timeAgo(incident.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
