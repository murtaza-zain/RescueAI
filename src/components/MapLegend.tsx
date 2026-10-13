export function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-10 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
        Legend
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <span className="flex h-4 w-4 items-center justify-center">
            <span className="h-3.5 w-3.5 rounded-full bg-red-500 ring-4 ring-red-200" />
          </span>
          Incident
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <span className="flex h-4 w-4 items-center justify-center">
            <span className="h-3.5 w-3.5 rounded-full bg-gray-900 ring-2 ring-blue-400" />
          </span>
          Recommended
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <span className="flex h-4 w-4 items-center justify-center">
            <span className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
          </span>
          Eligible Responder
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="flex h-4 w-4 items-center justify-center">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
          </span>
          Ineligible / Busy
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <span className="flex h-4 w-4 items-center justify-center">
            <span className="h-3.5 w-3.5 rounded-sm bg-indigo-500" />
          </span>
          Service Centre
        </div>
      </div>
    </div>
  );
}
