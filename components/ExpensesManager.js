"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { ArrowDown, ArrowUp, Check, CirclePlus, Pencil, RotateCcw, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import MonthPicker from "@/components/ui/MonthPicker";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { formatCurrency, formatMonth, todayLocal } from "@/lib/formatters";

async function api(url, options) {
  const response = await fetch(url, options);
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || "No se pudo completar la operación.");
  return json;
}

function daysUntil(date) {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

function remainingLabel(expense) {
  if (expense.status === "paid") return { text: "Pagado", className: "text-emerald-600" };
  const days = daysUntil(expense.dueDate);
  if (days < 0) return { text: `${Math.abs(days)} ${Math.abs(days) === 1 ? "día" : "días"} vencido`, className: "text-red-600" };
  if (days === 0) return { text: "Vence hoy", className: "text-amber-600" };
  return { text: `${days} ${days === 1 ? "día" : "días"}`, className: days <= 3 ? "text-amber-600" : "text-slate-600" };
}

export default function ExpensesManager({ initialMonth }) {
  const [month, setMonth] = useState(initialMonth);
  const [expenses, setExpenses] = useState([]);
  const [concepts, setConcepts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortDirection, setSortDirection] = useState("asc");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ conceptId: "", amount: "", closingDate: "", dueDate: "", notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [expenseResult, conceptResult, categoryResult] = await Promise.all([
        api(`/api/expenses?month=${month}`, { cache: "no-store" }),
        api("/api/concepts", { cache: "no-store" }),
        api("/api/categories", { cache: "no-store" }),
      ]);
      setExpenses(expenseResult.data);
      setConcepts(conceptResult.data);
      setCategories(categoryResult.data);
    } catch (error) { Swal.fire("No se pudo cargar", error.message, "error"); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const summary = useMemo(() => expenses.reduce((result, item) => {
    result.total += item.amount;
    result[item.status] += item.amount;
    return result;
  }, { total: 0, paid: 0, pending: 0 }), [expenses]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    const items = expenses.filter((expense) => {
      const matchesFilter = filter === "all" || expense.status === filter;
      return matchesFilter && (!query || expense.name.toLocaleLowerCase("es").includes(query) || expense.category.toLocaleLowerCase("es").includes(query));
    });
    return items.sort((first, second) => {
      const firstValue = sortBy === "name" ? first.name : first[sortBy];
      const secondValue = sortBy === "name" ? second.name : second[sortBy];
      if (!firstValue && !secondValue) return 0;
      if (!firstValue) return 1;
      if (!secondValue) return -1;
      const comparison = String(firstValue).localeCompare(String(secondValue), "es", { sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [expenses, filter, search, sortBy, sortDirection]);

  function showCreate() {
    const first = concepts.find((concept) => concept.isActive);
    setEditing(null);
    setForm({ conceptId: first?.id || "", amount: "", closingDate: "", dueDate: "", notes: "" });
    setOpen(true);
  }

  function showEdit(expense) {
    setEditing(expense);
    setForm({ conceptId: expense.conceptId, amount: expense.amount, closingDate: expense.closingDate || "", dueDate: expense.dueDate, notes: expense.notes });
    setOpen(true);
  }

  async function save(event) {
    event.preventDefault(); setSaving(true);
    try {
      if (editing) {
        await api(`/api/expenses/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        await api("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, month }) });
      }
      setOpen(false); await load();
      Swal.fire({ icon: "success", title: editing ? "Gasto actualizado" : "Gasto agregado", timer: 1300, showConfirmButton: false });
    } catch (error) { Swal.fire("No se pudo guardar", error.message, "error"); }
    finally { setSaving(false); }
  }

  async function toggleStatus(expense) {
    const status = expense.status === "paid" ? "pending" : "paid";
    try {
      const json = await api(`/api/expenses/${expense.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      setExpenses((items) => items.map((item) => item.id === expense.id ? json.data : item));
    } catch (error) { Swal.fire("No se pudo actualizar", error.message, "error"); }
  }

  async function remove(expense) {
    const answer = await Swal.fire({ title: `¿Eliminar ${expense.name}?`, text: `Se quitará únicamente de ${formatMonth(month)}.`, icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Eliminar", cancelButtonText: "Cancelar" });
    if (!answer.isConfirmed) return;
    try { await api(`/api/expenses/${expense.id}`, { method: "DELETE" }); await load(); }
    catch (error) { Swal.fire("No se pudo eliminar", error.message, "error"); }
  }

  return (
    <div className="animate-enter">
      <PageHeader
        eyebrow="Control mensual"
        title={`Gastos de ${formatMonth(month)}`}
        description="Marcá lo pagado, ajustá importes y mantené bajo control cada vencimiento."
        actions={<><MonthPicker value={month} onChange={setMonth} /><button className="btn-primary" onClick={showCreate}><CirclePlus size={17} /> Agregar gasto</button></>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total del mes</p><p className="mt-2 text-2xl font-black text-slate-950">{formatCurrency(summary.total)}</p></div>
        <div className="card border-emerald-100 p-5"><p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Pagado</p><p className="mt-2 text-2xl font-black text-emerald-700">{formatCurrency(summary.paid)}</p></div>
        <div className="card border-amber-100 p-5"><p className="text-xs font-bold uppercase tracking-wider text-amber-600">Pendiente</p><p className="mt-2 text-2xl font-black text-amber-700">{formatCurrency(summary.pending)}</p></div>
      </div>

      {loading ? <LoadingState /> : expenses.length === 0 ? (
        <EmptyState title={`No hay gastos en ${formatMonth(month)}`} description={concepts.length ? "Agregá un gasto e ingresá su importe y sus fechas para este mes." : "Primero creá los conceptos que querés controlar."} action={concepts.length ? <button className="btn-primary" onClick={showCreate}><CirclePlus size={17} /> Agregar gasto</button> : <Link href="/conceptos" className="btn-primary">Crear conceptos</Link>} />
      ) : (
        <section className="card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between sm:px-6">
            <div className="flex rounded-xl bg-slate-100 p-1">
              {[{ id: "all", label: "Todos" }, { id: "pending", label: "Pendientes" }, { id: "paid", label: "Pagados" }].map((item) => <button key={item.id} onClick={() => setFilter(item.id)} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${filter === item.id ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>{item.label}</button>)}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="field search-field py-2 sm:w-56" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar gasto..." /></label>
              <div className="flex gap-2">
                <select className="field py-2 sm:w-44" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Ordenar gastos por">
                  <option value="name">Concepto</option>
                  <option value="closingDate">Fecha de cierre</option>
                  <option value="dueDate">Vencimiento</option>
                </select>
                <button className="btn-secondary px-3" onClick={() => setSortDirection((value) => value === "asc" ? "desc" : "asc")} title={sortDirection === "asc" ? "Orden ascendente" : "Orden descendente"} aria-label="Cambiar dirección del orden">
                  {sortDirection === "asc" ? <ArrowUp size={17} /> : <ArrowDown size={17} />}
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Estado</th><th className="px-5 py-4">Concepto</th><th className="px-5 py-4">Cierre</th><th className="px-5 py-4">Vencimiento</th><th className="px-5 py-4">Días restantes</th><th className="px-5 py-4">Importe</th><th className="px-5 py-4 text-right">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((expense) => {
                  const overdue = expense.status === "pending" && expense.dueDate < todayLocal();
                  const remaining = remainingLabel(expense);
                  return (
                    <tr key={expense.id} className={`transition hover:bg-slate-50/70 ${expense.status === "paid" ? "bg-emerald-50/20" : ""}`}>
                      <td className="px-5 py-4"><button onClick={() => toggleStatus(expense)} className={`grid h-7 w-7 place-items-center rounded-full border-2 transition ${expense.status === "paid" ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white text-transparent hover:border-violet-500"}`} aria-label={expense.status === "paid" ? "Marcar pendiente" : "Marcar pagado"}><Check size={15} strokeWidth={3} /></button></td>
                      <td className="px-5 py-4"><div className={`text-sm font-bold ${expense.status === "paid" ? "text-slate-500 line-through decoration-slate-300" : "text-slate-900"}`}>{expense.name}</div><div className="mt-1 flex items-center gap-2 text-xs text-slate-400"><span className="h-2 w-2 rounded-full" style={{ background: categories.find((item) => item.name === expense.category)?.color || "#64748b" }} />{expense.category}{expense.notes && ` · ${expense.notes}`}</div></td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-500">{expense.closingDate ? new Date(`${expense.closingDate}T12:00:00`).toLocaleDateString("es-AR") : "—"}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${overdue ? "bg-red-50 text-red-600" : expense.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"}`}>{overdue ? "Vencido · " : ""}{new Date(`${expense.dueDate}T12:00:00`).toLocaleDateString("es-AR")}</span></td>
                      <td className={`px-5 py-4 text-sm font-bold ${remaining.className}`}>{remaining.text}</td>
                      <td className="px-5 py-4 text-sm font-black text-slate-900">{formatCurrency(expense.amount)}</td>
                      <td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => toggleStatus(expense)} className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600" title={expense.status === "paid" ? "Volver a pendiente" : "Marcar pagado"}>{expense.status === "paid" ? <RotateCcw size={17} /> : <Check size={17} />}</button><button onClick={() => showEdit(expense)} className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-violet-600" title="Editar"><Pencil size={17} /></button><button onClick={() => remove(expense)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar"><Trash2 size={17} /></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <p className="py-12 text-center text-sm text-slate-500">No hay resultados para este filtro.</p>}
        </section>
      )}

      <Modal open={open} onClose={() => !saving && setOpen(false)} title={editing ? `Editar ${editing.name}` : "Agregar gasto"} description={editing ? "El cambio afecta solamente a este mes." : `Nuevo gasto para ${formatMonth(month)}.`}>
        <form onSubmit={save} className="space-y-4">
          {!editing && <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Concepto</span><select className="field" required value={form.conceptId} onChange={(e) => setForm({ ...form, conceptId: Number(e.target.value) })}><option value="" disabled>Seleccionar...</option>{concepts.filter((concept) => concept.isActive).map((concept) => <option key={concept.id} value={concept.id}>{concept.name} · {concept.category}</option>)}</select></label>}
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Importe</span><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span><input className="field money-field" type="number" min="0" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="mb-1.5 block text-sm font-bold text-slate-700">Fecha de cierre <span className="font-normal text-slate-400">(opcional)</span></span><input className="field" type="date" value={form.closingDate} onChange={(e) => setForm({ ...form, closingDate: e.target.value })} /></label>
            <label><span className="mb-1.5 block text-sm font-bold text-slate-700">Vencimiento</span><input className="field" type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label>
          </div>
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Notas <span className="font-normal text-slate-400">(opcional)</span></span><textarea className="field min-h-24 resize-none" maxLength={300} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Detalle, número de cuota, etc." /></label>
          <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="btn-primary" disabled={saving || (!editing && !form.conceptId)}>{saving ? "Guardando..." : "Guardar gasto"}</button></div>
        </form>
      </Modal>
    </div>
  );
}
