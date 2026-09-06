"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { CirclePlus, Pencil, Power, Tags, Trash2 } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";

const emptyForm = { name: "", color: "#7c3aed", isActive: true };

async function api(url, options) {
  const response = await fetch(url, options);
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || "No se pudo completar la operación.");
  return json;
}

export default function CategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api("/api/categories", { cache: "no-store" });
      setCategories(result.data);
    } catch (error) {
      Swal.fire("No se pudo cargar", error.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function showCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function showEdit(category) {
    setEditing(category);
    setForm({ name: category.name, color: category.color, isActive: category.isActive });
    setOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api(editing ? `/api/categories/${editing.id}` : "/api/categories", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setOpen(false);
      await load();
      Swal.fire({ icon: "success", title: editing ? "Categoría actualizada" : "Categoría creada", timer: 1400, showConfirmButton: false });
    } catch (error) {
      Swal.fire("No se pudo guardar", error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(category) {
    const answer = await Swal.fire({
      title: `¿Eliminar ${category.name}?`,
      text: "Si está asignada a conceptos se archivará para conservar la información.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#7c3aed",
    });
    if (!answer.isConfirmed) return;
    try {
      const result = await api(`/api/categories/${category.id}`, { method: "DELETE" });
      await load();
      Swal.fire({ icon: "success", title: result.data.archived ? "Categoría archivada" : "Categoría eliminada", timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire("No se pudo completar", error.message, "error");
    }
  }

  return (
    <div className="animate-enter">
      <PageHeader
        eyebrow="Organización"
        title="Categorías"
        description="Creá y personalizá las categorías disponibles al registrar tus conceptos."
        actions={<button className="btn-primary" onClick={showCreate}><CirclePlus size={17} /> Nueva categoría</button>}
      />

      {loading ? <LoadingState /> : categories.length === 0 ? (
        <EmptyState title="No hay categorías" description="Creá una categoría para comenzar a organizar tus gastos." action={<button className="btn-primary" onClick={showCreate}><CirclePlus size={17} /> Crear categoría</button>} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-4">Categoría</th><th className="px-6 py-4">Color</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => (
                  <tr key={category.id} className={`transition hover:bg-slate-50/70 ${!category.isActive ? "opacity-55" : ""}`}>
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: category.color }}><Tags size={18} /></div><span className="text-sm font-bold text-slate-900">{category.name}</span></div></td>
                    <td className="px-6 py-4"><span className="font-mono text-xs font-semibold text-slate-500">{category.color.toUpperCase()}</span></td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${category.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><Power size={12} />{category.isActive ? "Activa" : "Archivada"}</span></td>
                    <td className="px-6 py-4"><div className="flex justify-end gap-1"><button onClick={() => showEdit(category)} className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-violet-600" title="Editar"><Pencil size={17} /></button><button onClick={() => remove(category)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar"><Trash2 size={17} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => !saving && setOpen(false)} title={editing ? "Editar categoría" : "Nueva categoría"} description="El color permite identificarla rápidamente en listados y gráficos.">
        <form onSubmit={save} className="space-y-4">
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Nombre</span><input className="field" required maxLength={50} autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ej. Mascotas" /></label>
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Color</span><div className="flex items-center gap-3"><input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} className="h-12 w-16 cursor-pointer rounded-xl border border-slate-200 bg-white p-1" /><input className="field font-mono uppercase" pattern="#[0-9a-fA-F]{6}" required value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} /></div></label>
          {editing && <label className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><span className="block text-sm font-bold text-slate-700">Categoría activa</span><span className="text-xs text-slate-500">Estará disponible para nuevos conceptos</span></div><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="h-5 w-5 accent-violet-600" /></label>}
          <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="btn-primary" disabled={saving}>{saving ? "Guardando..." : "Guardar categoría"}</button></div>
        </form>
      </Modal>
    </div>
  );
}
