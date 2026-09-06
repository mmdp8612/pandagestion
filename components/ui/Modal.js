"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({ open, onClose, title, description, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto overscroll-contain bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Cerrar" />
      <div className="animate-enter relative my-4 max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
        <button onClick={onClose} className="absolute right-5 top-5 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar">
          <X size={20} />
        </button>
        <h2 className="pr-10 text-xl font-extrabold text-slate-950">{title}</h2>
        {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
