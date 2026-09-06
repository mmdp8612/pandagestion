"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Check, CirclePlus, CopyPlus, Pencil, RotateCcw, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import MonthPicker from "@/components/ui/MonthPicker";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { CATEGORY_COLORS } from "@/lib/constants";
import { formatCurrency, formatMonth, todayLocal } from "@/lib/formatters";

async function api(url, options) {
  const response = await fetch(url, options);
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || "No se pudo completar la operación.");
  return json;
}

function buildDueDate(month, day) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return `${month}-${String(Math.min(Number(day), lastDay)).padStart(2, "0")}`;
}

export default function ExpensesManager({ initialMonth }) {
  const [month, setMonth] = useState(initialMonth);
  const [expenses, setExpenses] = useState([]);
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ conceptId: "", amount: "", dueDate: "", notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [expenseResult, conceptResult] = await Promise.all([
        api(`/api/expenses?month=${month}`, { cache: "no-store" }),
        api("/api/concepts", { cache: "no-store" }),
      ]);
      setExpenses(expenseResult.data);
      setConcepts(conceptResult.data);
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

  const filtered = useMemo(() => expenses.filter((expense) => {
    const matchesFilter = filter === "all" || expense.status === filter;
    const query = search.trim().toLocaleLowerCase("es");
    return matchesFilter && (!query || expense.name.toLocaleLowerCase("es").includes(query) || expense.category.toLocaleLowerCase("es").includes(query));
  }), [expenses, filter, search]);

  function showCreate() {
    const first = concepts.find((concept) => concept.isActive);
    setEditing(null);
    setForm(first ? { conceptId: first.id, amount: first.defaultAmount, dueDate: buildDueDate(month, first.dueDay), notes: "" } : { conceptId: "", amount: "", dueDate: `${month}-01`, notes: "" });
    setOpen(true);
  }

  function selectConcept(id) {
    const concept = concepts.find((item) => item.id === Number(id));
    setForm({ ...form, conceptId: Number(id), amount: concept?.defaultAmount ?? "", dueDate: concept ? buildDueDate(month, concept.dueDay) : `${month}-01` });
  }

  function showEdit(expense) {
    setEditing(expense);
    setForm({ conceptId: expense.conceptId, amount: expense.amount, dueDate: expense.dueDate, notes: expense.notes });
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

  async function generate() {
    if (!concepts.some((item) => item.isActive)) {
      Swal.fire({ title: "No hay conceptos activos", text: "Creá al menos un concepto para poder generar el mes.", icon: "info", confirmButtonColor: "#7c3aed" });
      return;
    }
    const answer = await Swal.fire({ title: `Generar ${formatMonth(month)}`, text: "Se agregarán todos los conceptos activos que todavía no estén cargados.", icon: "question", showCancelButton: true, confirmButtonColor: "#7c3aed", confirmButtonText: "Generar gastos", cancelButtonText: "Cancelar" });
    if (!answer.isConfirmed) return;
    try {
      const json = await api("/api/expenses/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month }) });
      await load();
      Swal.fire({ icon: json.data.created ? "success" : "info", title: json.data.created ? `${json.data.created} gastos agregados` : "El mes ya estaba completo", timer: 1700, showConfirmButton: false });
    } catch (error) { Swal.fire("No se pudo generar", error.message, "error"); }
  }

  return (
    <div className="animate-enter">
      <PageHeader
        eyebrow="Control mensual"
        title={`Gastos de ${formatMonth(month)}`}
        description="Marcá lo pagado, ajustá importes y mantené bajo control cada vencimiento."
        actions={<><MonthPicker value={month} onChange={setMonth} /><button className="btn-secondary" onClick={generate}><CopyPlus size={17} /> Generar mes</button><button className="btn-primary" onClick={showCreate}><CirclePlus size={17} /> Agregar gasto</button></>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total del mes</p><p className="mt-2 text-2xl font-black text-slate-950">{formatCurrency(summary.total)}</p></div>
        <div className="card border-emerald-100 p-5"><p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Pagado</p><p className="mt-2 text-2xl font-black text-emerald-700">{formatCurrency(summary.paid)}</p></div>
        <div className="card border-amber-100 p-5"><p className="text-xs font-bold uppercase tracking-wider text-amber-600">Pendiente</p><p className="mt-2 text-2xl font-black text-amber-700">{formatCurrency(summary.pending)}</p></div>
      </div>

      {loading ? <LoadingState /> : expenses.length === 0 ? (
        <EmptyState title={`No hay gastos en ${formatMonth(month)}`} description={concepts.length ? "Generá el mes desde tus conceptos habituales o agregá un gasto manualmente." : "Primero creá los conceptos que querés controlar mes a mes."} action={concepts.length ? <button className="btn-primary" onClick={generate}><CopyPlus size={17} /> Generar mes</button> : <Link href="/conceptos" className="btn-primary">Crear conceptos</Link>} />
      ) : (
        <section className="card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex rounded-xl bg-slate-100 p-1">
              {[{ id: "all", label: "Todos" }, { id: "pending", label: "Pendientes" }, { id: "paid", label: "Pagados" }].map((item) => <button key={item.id} onClick={() => setFilter(item.id)} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${filter === item.id ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>{item.label}</button>)}
            </div>
            <label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="field py-2 pl-9 sm:w-64" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar gasto..." /></label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-4">Estado</th><th className="px-6 py-4">Concepto</th><th className="px-6 py-4">Vencimiento</th><th className="px-6 py-4">Importe</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((expense) => {
                  const overdue = expense.status === "pending" && expense.dueDate < todayLocal();
                  return (
                    <tr key={expense.id} className={`transition hover:bg-slate-50/70 ${expense.status === "paid" ? "bg-emerald-50/20" : ""}`}>
                      <td className="px-6 py-4"><button onClick={() => toggleStatus(expense)} className={`grid h-7 w-7 place-items-center rounded-full border-2 transition ${expense.status === "paid" ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white text-transparent hover:border-violet-500"}`} aria-label={expense.status === "paid" ? "Marcar pendiente" : "Marcar pagado"}><Check size={15} strokeWidth={3} /></button></td>
                      <td className="px-6 py-4"><div className={`text-sm font-bold ${expense.status === "paid" ? "text-slate-500 line-through decoration-slate-300" : "text-slate-900"}`}>{expense.name}</div><div className="mt-1 flex items-center gap-2 text-xs text-slate-400"><span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[expense.category] || "#64748b" }} />{expense.category}{expense.notes && ` · ${expense.notes}`}</div></td>
                      <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${overdue ? "bg-red-50 text-red-600" : expense.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"}`}>{overdue ? "Vencido · " : ""}{new Date(`${expense.dueDate}T12:00:00`).toLocaleDateString("es-AR")}</span></td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900">{formatCurrency(expense.amount)}</td>
                      <td className="px-6 py-4"><div className="flex justify-end gap-1"><button onClick={() => toggleStatus(expense)} className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600" title={expense.status === "paid" ? "Volver a pendiente" : "Marcar pagado"}>{expense.status === "paid" ? <RotateCcw size={17} /> : <Check size={17} />}</button><button onClick={() => showEdit(expense)} className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-violet-600" title="Editar"><Pencil size={17} /></button><button onClick={() => remove(expense)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar"><Trash2 size={17} /></button></div></td>
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
          {!editing && <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Concepto</span><select className="field" required value={form.conceptId} onChange={(e) => selectConcept(e.target.value)}><option value="" disabled>Seleccionar...</option>{concepts.filter((concept) => concept.isActive).map((concept) => <option key={concept.id} value={concept.id}>{concept.name} · {concept.category}</option>)}</select></label>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="mb-1.5 block text-sm font-bold text-slate-700">Importe</span><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span><input className="field pl-7" type="number" min="0" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div></label>
            <label><span className="mb-1.5 block text-sm font-bold text-slate-700">Vencimiento</span><input className="field" type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label>
          </div>
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Notas <span className="font-normal text-slate-400">(opcional)</span></span><textarea className="field min-h-24 resize-none" maxLength={300} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Detalle, número de cuota, etc." /></label>
          <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="btn-primary" disabled={saving || (!editing && !form.conceptId)}>{saving ? "Guardando..." : "Guardar gasto"}</button></div>
        </form>
      </Modal>
    </div>
  );
}
