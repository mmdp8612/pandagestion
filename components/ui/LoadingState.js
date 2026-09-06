export default function LoadingState({ label = "Cargando información..." }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
        {label}
      </div>
    </div>
  );
}
