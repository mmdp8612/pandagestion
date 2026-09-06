"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Database, RotateCcw, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

export default function SettingsView() {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);

  async function resetDatabase() {
    const answer = await Swal.fire({
      title: "¿Reiniciar la base de datos?",
      html: "Se eliminarán <b>todos los conceptos, gastos e historiales</b>. Esta acción no se puede deshacer.",
      icon: "warning",
      input: "text",
      inputPlaceholder: "Escribí REINICIAR",
      showCancelButton: true,
      confirmButtonText: "Borrar todos los datos",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      preConfirm: (value) => {
        if (value !== "REINICIAR") return Swal.showValidationMessage("Escribí REINICIAR para confirmar.");
        return true;
      },
    });
    if (!answer.isConfirmed) return;
    setResetting(true);
    try {
      const response = await fetch("/api/reset", { method: "POST" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      await Swal.fire({ icon: "success", title: "Base reiniciada", text: "PandaGestion está listo para comenzar de nuevo.", confirmButtonColor: "#7c3aed" });
      router.push("/");
      router.refresh();
    } catch (error) { Swal.fire("No se pudo reiniciar", error.message, "error"); setResetting(false); }
  }

  return (
    <div className="animate-enter">
      <PageHeader eyebrow="Preferencias" title="Configuración" description="Administrá el almacenamiento local y los datos de la aplicación." />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-600"><Database size={22} /></div>
            <div><h2 className="font-extrabold text-slate-900">Base de datos local</h2><p className="mt-1 text-sm leading-6 text-slate-500">La información se guarda en SQLite dentro de <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">data/panda-gestion.db</code>. Guardá una copia de ese archivo para hacer un respaldo.</p></div>
          </div>
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><ShieldCheck size={18} /><span><b>Privado:</b> los datos permanecen en tu servidor.</span></div>
        </section>
        <section className="card border-red-100 p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600"><RotateCcw size={22} /></div>
            <div><h2 className="font-extrabold text-slate-900">Reiniciar aplicación</h2><p className="mt-1 text-sm leading-6 text-slate-500">Elimina permanentemente conceptos, gastos mensuales y todo el historial.</p></div>
          </div>
          <button disabled={resetting} onClick={resetDatabase} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"><RotateCcw size={16} />{resetting ? "Reiniciando..." : "Reiniciar base de datos"}</button>
        </section>
      </div>
    </div>
  );
}
