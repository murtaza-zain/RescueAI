import { ShieldAlert } from 'lucide-react';

export function DemoModeBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700">
      <ShieldAlert className="h-3.5 w-3.5" />
      Demo Mode
    </div>
  );
}
