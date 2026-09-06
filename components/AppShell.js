"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, ListChecks, Menu, ReceiptText, Settings, Tags, WalletCards, X } from "lucide-react";

const navigation = [
  { href: "/", label: "Resumen", icon: BarChart3 },
  { href: "/gastos", label: "Gastos mensuales", icon: WalletCards },
  { href: "/conceptos", label: "Conceptos", icon: ListChecks },
  { href: "/categorias", label: "Categorías", icon: Tags },
  { href: "/historial", label: "Historial", icon: ReceiptText },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

function Sidebar({ onNavigate }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col bg-slate-950 px-4 py-6 text-white">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-3 px-2">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500 text-xl shadow-lg shadow-violet-900/40">🐼</div>
        <div>
          <div className="text-lg font-extrabold tracking-tight">PandaGestion</div>
          <div className="text-xs text-slate-400">Finanzas personales</div>
        </div>
      </Link>

      <nav className="mt-10 space-y-1.5">
        {navigation.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                active ? "bg-violet-500 text-white shadow-lg shadow-violet-950/30" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-violet-300">Tu objetivo</div>
        <p className="text-sm leading-5 text-slate-300">Que ningún vencimiento te tome por sorpresa.</p>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Cerrar menú" />
          <aside className="relative h-full w-72 shadow-2xl">
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4 z-10 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Cerrar menú">
              <X size={20} />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200/80 bg-[#f6f7fb]/90 px-4 backdrop-blur-xl sm:px-8 lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm" aria-label="Abrir menú">
            <Menu size={20} />
          </button>
          <span className="ml-3 font-extrabold text-slate-900">PandaGestion</span>
        </header>
        <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-7 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
