"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { CirclePlus, Pencil, Power, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { formatCurrency } from "@/lib/formatters";

const emptyForm = { name: "", category: "", defaultAmount: "", dueDay: 10, closingDay: "", isActive: true };

async function readResponse(response) {
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || "No se pudo completar la operación.");
  return json;
}

export default function ConceptsManager() {
  const [concepts, setConcepts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [conceptResult, categoryResult] = await Promise.all([
        readResponse(await fetch("/api/concepts", { cache: "no-store" })),
        readResponse(await fetch("/api/categories", { cache: "no-store" })),
      ]);
      setConcepts(conceptResult.data);
      setCategories(categoryResult.data);
    } catch (error) {
      Swal.fire("No se pudo cargar", error.message, "error");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function showCreate() {
    const firstCategory = categories.find((category) => category.isActive)?.name || "";
    setEditing(null); setForm({ ...emptyForm, category: firstCategory }); setOpen(true);
  }

  function showEdit(concept) {
    setEditing(concept);
    setForm({ name: concept.name, category: concept.category, defaultAmount: concept.defaultAmount, dueDay: concept.dueDay, closingDay: concept.closingDay ?? "", isActive: concept.isActive });
    setOpen(true);
  }

  async function save(event) {
    event.preventDefault(); setSaving(true);
    try {
      await readResponse(await fetch(editing ? `/api/concepts/${editing.id}` : "/api/concepts", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }));
      setOpen(false); await load();
      Swal.fire({ icon: "success", title: editing ? "Concepto actualizado" : "Concepto creado", timer: 1400, showConfirmButton: false });
    } catch (error) { Swal.fire("Revisá los datos", error.message, "error"); }
    finally { setSaving(false); }
  }

  async function remove(concept) {
    const answer = await Swal.fire({
      title: `¿Eliminar ${concept.name}?`,
      text: "Si tiene gastos históricos se archivará para conservar la información.",
      icon: "warning", showCancelButton: true, confirmButtonText: "Sí, continuar", cancelButtonText: "Cancelar",
      confirmButtonColor: "#7c3aed",
    });
    if (!answer.isConfirmed) return;
    try {
      const json = await readResponse(await fetch(`/api/concepts/${concept.id}`, { method: "DELETE" }));
      await load();
      Swal.fire({ icon: "success", title: json.data.archived ? "Concepto archivado" : "Concepto eliminado", timer: 1500, showConfirmButton: false });
    } catch (error) { Swal.fire("No se pudo completar", error.message, "error"); }
  }

  return (
    <div className="animate-enter">
      <PageHeader eyebrow="Plantillas reutilizables" title="Conceptos" description="Definí una vez tus gastos habituales. El importe puede ajustarse luego en cada mes sin modificar el historial." actions={<button className="btn-primary" onClick={showCreate}><CirclePlus size={17} /> Nuevo concepto</button>} />
      {loading ? <LoadingState /> : concepts.length === 0 ? (
        <EmptyState title="Creá tu primer concepto" description="Por ejemplo: Internet, tarjeta de crédito, alquiler o celular." action={<button className="btn-primary" onClick={showCreate}><CirclePlus size={17} /> Crear concepto</button>} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-4">Concepto</th><th className="px-6 py-4">Categoría</th><th className="px-6 py-4">Importe habitual</th><th className="px-6 py-4">Cierre</th><th className="px-6 py-4">Vencimiento</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {concepts.map((concept) => (
                  <tr key={concept.id} className={`transition hover:bg-slate-50/70 ${!concept.isActive ? "opacity-55" : ""}`}>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{concept.name}</td>
                    <td className="px-6 py-4"><span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ background: categories.find((item) => item.name === concept.category)?.color || "#64748b" }} />{concept.category}</span></td>
                    <td className="px-6 py-4 text-sm font-extrabold text-slate-800">{formatCurrency(concept.defaultAmount)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{concept.closingDay ? `Día ${concept.closingDay}` : "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">Día {concept.dueDay}</td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${concept.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><Power size={12} />{concept.isActive ? "Activo" : "Archivado"}</span></td>
                    <td className="px-6 py-4"><div className="flex justify-end gap-1"><button onClick={() => showEdit(concept)} className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-violet-600" title="Editar"><Pencil size={17} /></button><button onClick={() => remove(concept)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar"><Trash2 size={17} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => !saving && setOpen(false)} title={editing ? "Editar concepto" : "Nuevo concepto"} description="Estos valores se usarán como base al generar un mes.">
        <form onSubmit={save} className="space-y-4">
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Nombre</span><input className="field" required maxLength={80} autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Internet" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="mb-1.5 block text-sm font-bold text-slate-700">Categoría</span><select className="field" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="" disabled>Seleccionar...</option>{categories.filter((category) => category.isActive || category.name === form.category).map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select></label>
            <label><span className="mb-1.5 block text-sm font-bold text-slate-700">Importe habitual</span><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span><input className="field money-field" type="number" min="0" step="0.01" required value={form.defaultAmount} onChange={(e) => setForm({ ...form, defaultAmount: e.target.value })} placeholder="0,00" /></div></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="mb-1.5 block text-sm font-bold text-slate-700">Día de cierre <span className="font-normal text-slate-400">(opcional)</span></span><input className="field" type="number" min="1" max="31" value={form.closingDay} onChange={(e) => setForm({ ...form, closingDay: e.target.value })} placeholder="Ej. 28" /></label>
            <label><span className="mb-1.5 block text-sm font-bold text-slate-700">Día de vencimiento</span><input className="field" type="number" min="1" max="31" required value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: Number(e.target.value) })} /></label>
          </div>
          {editing && <label className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><span className="block text-sm font-bold text-slate-700">Concepto activo</span><span className="text-xs text-slate-500">Se incluirá al generar nuevos meses</span></div><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-5 w-5 accent-violet-600" /></label>}
          <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="btn-primary" disabled={saving}>{saving ? "Guardando..." : "Guardar concepto"}</button></div>
        </form>
      </Modal>
    </div>
  );
}
