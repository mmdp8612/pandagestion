import { Inbox } from "lucide-react";

export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-600">
        <Inbox size={22} />
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
