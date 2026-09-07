"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, CheckCircle2, CircleDollarSign, Clock3, ReceiptText, TrendingUp } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import MonthPicker from "@/components/ui/MonthPicker";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import { CATEGORY_COLORS } from "@/lib/constants";
import { currentMonth, formatCurrency, formatMonth } from "@/lib/formatters";

function StatCard({ label, value, detail, icon: Icon, color }) {
  const colors = {
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
  };
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-xs font-medium text-slate-400">{detail}</p>
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${colors[color]}`}><Icon size={21} /></div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs font-bold text-slate-500">{label ? formatMonth(label) : payload[0]?.name}</p>
      {payload.map((item) => <p key={item.dataKey || item.name} className="text-sm font-extrabold" style={{ color: item.color }}>{formatCurrency(item.value)}</p>)}
    </div>
  );
}

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [categoryColors, setCategoryColors] = useState(CATEGORY_COLORS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/stats?month=${month}`, { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
      ]);
      const [statsJson, categoriesJson] = await Promise.all([statsResponse.json(), categoriesResponse.json()]);
      setData(statsJson.data);
      setCategoryColors({ ...CATEGORY_COLORS, ...Object.fromEntries((categoriesJson.data || []).map((category) => [category.name, category.color])) });
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <div className="animate-enter">
      <PageHeader
        eyebrow="Panel general"
        title={`Tu resumen de ${formatMonth(month)}`}
        description="Una vista rápida de tus compromisos, pagos realizados y evolución mensual."
        actions={<MonthPicker value={month} onChange={setMonth} />}
      />
      {loading ? <LoadingState /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Gastos del mes" value={formatCurrency(data.summary.total)} detail={`${data.summary.count} conceptos registrados`} icon={CircleDollarSign} color="violet" />
            <StatCard label="Total pagado" value={formatCurrency(data.summary.paid)} detail={`${data.summary.progress}% del mes completado`} icon={CheckCircle2} color="emerald" />
            <StatCard label="Aún pendiente" value={formatCurrency(data.summary.pending)} detail={data.summary.pending ? "Importe por cubrir" : "Todo está al día"} icon={Clock3} color="amber" />
            <StatCard label="Cumplimiento" value={`${data.summary.progress}%`} detail="Pagado sobre el total mensual" icon={TrendingUp} color="sky" />
          </div>

          {data.summary.count === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Todavía no hay gastos en este mes"
                description="Creá tus conceptos y registrá los gastos del mes para empezar a controlar tus vencimientos."
                action={<Link className="btn-primary" href="/gastos">Ir a gastos <ArrowRight size={16} /></Link>}
              />
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
                <section className="card p-5 sm:p-6">
                  <div className="mb-6">
                    <h2 className="font-extrabold text-slate-900">Evolución de gastos</h2>
                    <p className="mt-1 text-xs text-slate-500">Total y pagos acumulados de los últimos 6 meses</p>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.timeline} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient>
                          <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.18}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e8edf4" />
                        <XAxis dataKey="month" tickFormatter={(value) => formatMonth(value).split(" ")[0].slice(0, 3)} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="total" name="Total" stroke="#7c3aed" strokeWidth={2.5} fill="url(#totalGradient)" />
                        <Area type="monotone" dataKey="paid" name="Pagado" stroke="#10b981" strokeWidth={2.5} fill="url(#paidGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="card p-5 sm:p-6">
                  <div className="mb-4">
                    <h2 className="font-extrabold text-slate-900">Distribución</h2>
                    <p className="mt-1 text-xs text-slate-500">Participación por categoría</p>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.categories} dataKey="value" innerRadius={56} outerRadius={82} paddingAngle={3} stroke="none">
                          {data.categories.map((entry) => <Cell key={entry.name} fill={categoryColors[entry.name] || "#64748b"} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3">
                    {data.categories.map((category) => (
                      <div key={category.name} className="flex min-w-0 items-center gap-2 text-xs">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: categoryColors[category.name] || "#64748b" }} />
                        <span className="truncate font-semibold text-slate-600">{category.name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section className="card mt-6 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
                  <div><h2 className="font-extrabold text-slate-900">Movimientos recientes</h2><p className="mt-1 text-xs text-slate-500">Últimos gastos actualizados</p></div>
                  <Link href={`/gastos?month=${month}`} className="flex items-center gap-1 text-sm font-bold text-violet-600 hover:text-violet-800">Ver todos <ArrowRight size={15} /></Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {data.recent.map((expense) => (
                    <div key={expense.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500"><ReceiptText size={18} /></div>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{expense.name}</p><p className="text-xs text-slate-400">{expense.category} · vence {new Date(`${expense.dueDate}T12:00:00`).toLocaleDateString("es-AR")}</p></div>
                      <div className="text-right"><p className="text-sm font-extrabold text-slate-900">{formatCurrency(expense.amount)}</p><span className={`text-xs font-bold ${expense.status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>{expense.status === "paid" ? "Pagado" : "Pendiente"}</span></div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
