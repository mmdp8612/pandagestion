import { CalendarDays } from "lucide-react";

export default function MonthPicker({ value, onChange }) {
  return (
    <label className="relative flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100">
      <CalendarDays size={17} className="text-slate-400" />
      <input
        type="month"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
        aria-label="Seleccionar mes"
      />
    </label>
  );
}
