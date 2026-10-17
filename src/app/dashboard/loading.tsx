export default function Loading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#b8e2f4]">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Loading workouts…</p>
      </main>
    </div>
  );
}
