export default function Loading() {
  return (
    <div className="container-page pb-20 pt-7">
      <div className="skeleton h-4 w-56 rounded" />
      <div className="mt-5 grid gap-10 md:grid-cols-[1.1fr_1fr]">
        <div className="skeleton aspect-[4/5] rounded-[var(--radius-surface)]" />
        <div className="space-y-4">
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-10 w-3/4 rounded" />
          <div className="skeleton h-16 rounded" />
          <div className="skeleton h-8 w-32 rounded" />
          <div className="skeleton h-12 rounded" />
        </div>
      </div>
    </div>
  );
}
