"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { ArrowRight, CalendarRange, TrendingDown, TrendingUp } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import { formatCurrency, formatMonth } from "@/lib/formatters";

export default function HistoryView() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history", { cache: "no-store" }).then(async (response) => {
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      setHistory(json.data);
    }).catch((error) => Swal.fire("No se pudo cargar", error.message, "error")).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-enter">
      <PageHeader eyebrow="Comparación mensual" title="Historial" description="Revisá tus períodos anteriores y compará cómo evolucionaron tus gastos." />
      {loading ? <LoadingState /> : history.length === 0 ? <EmptyState title="Todavía no hay historial" description="Los meses que generes aparecerán aquí para que puedas compararlos." /> : (
        <div className="space-y-4">
          {history.map((item, index) => {
            const older = history[index + 1];
            const change = older?.total ? ((item.total - older.total) / older.total) * 100 : null;
            return (
              <article key={item.month} className="card flex flex-col gap-5 p-5 transition hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-center sm:p-6">
                <div className="flex min-w-56 items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-600"><CalendarRange size={22} /></div>
                  <div><h2 className="font-extrabold text-slate-900">{formatMonth(item.month)}</h2><p className="mt-1 text-xs text-slate-400">{item.count} gastos registrados</p></div>
                </div>
                <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                  <div><p className="text-xs font-semibold text-slate-400">Total</p><p className="mt-1 text-sm font-extrabold text-slate-900">{formatCurrency(item.total)}</p></div>
                  <div><p className="text-xs font-semibold text-slate-400">Pagado</p><p className="mt-1 text-sm font-extrabold text-emerald-600">{formatCurrency(item.paid)}</p></div>
                  <div><p className="text-xs font-semibold text-slate-400">Pendiente</p><p className="mt-1 text-sm font-extrabold text-amber-600">{formatCurrency(item.pending)}</p></div>
                  <div><p className="text-xs font-semibold text-slate-400">Vs. mes anterior</p><div className={`mt-1 flex items-center gap-1 text-sm font-extrabold ${change === null ? "text-slate-400" : change > 0 ? "text-red-500" : "text-emerald-600"}`}>{change === null ? "—" : <>{change > 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}{Math.abs(change).toFixed(1)}%</>}</div></div>
                </div>
                <div className="w-full sm:w-36">
                  <div className="mb-2 flex justify-between text-xs font-bold"><span className="text-slate-400">Pagado</span><span className="text-slate-700">{item.progress}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${item.progress}%` }} /></div>
                  <Link href={`/gastos?month=${item.month}`} className="mt-3 flex items-center justify-end gap-1 text-xs font-bold text-violet-600">Ver detalle <ArrowRight size={13} /></Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
