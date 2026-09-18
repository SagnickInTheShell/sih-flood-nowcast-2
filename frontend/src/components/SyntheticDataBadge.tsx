// ASSUMPTION: the real-mode label names Bellandur specifically since that's
// the only real bbox this project currently ships/documents (see
// docs/DATA_SOURCES.md). A future multi-ward deployment would want the
// backend to return a ward display name rather than hardcoding it here.
export default function SyntheticDataBadge({ isSynthetic }: { isSynthetic: boolean }) {
  if (!isSynthetic) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-safeGreen/15 text-emerald-400 border border-safeGreen/40 shadow-sm shadow-safeGreen/10 font-medium tracking-wide"
        title="Real road network (OpenStreetMap) and real elevation data for Bellandur, Bengaluru."
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Bellandur, Bengaluru &mdash; Live OSM/SRTM Data
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-gold/15 text-amber-300 border border-gold/40 shadow-sm shadow-gold/10 font-medium tracking-wide"
      title="This ward is a deterministic synthetic reference ward, not a real place."
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Synthetic Reference Ward
    </span>
  );
}

