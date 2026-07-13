import type { LucideIcon } from 'lucide-react';

export function KpiCard({
  label,
  value,
  icon: Icon,
  eyebrow,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  eyebrow?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <Icon className="h-4 w-4 text-brand-500" />
      </div>
      <p className="tabular-nums font-serif text-[28px] font-semibold leading-none text-slate-900">
        {value}
      </p>
      <div className="mt-3 h-px w-8 border-t border-dashed border-brand-300" />
      {eyebrow && <p className="mt-2 text-xs text-slate-500">{eyebrow}</p>}
    </div>
  );
}
