import { cn } from "@/lib/utils";

const config: Record<string, { label: string; className: string }> = {
  CRITICAL: { label: "Critical", className: "bg-red-100 text-red-800 border-red-200" },
  HIGH:     { label: "High",     className: "bg-orange-100 text-orange-800 border-orange-200" },
  MEDIUM:   { label: "Medium",   className: "bg-amber-100 text-amber-800 border-amber-200" },
  LOW:      { label: "Low",      className: "bg-blue-100 text-blue-800 border-blue-200" },
  INFORMATIONAL: { label: "Info", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

export function RiskBadge({ rating }: { rating: string }) {
  const c = config[rating] ?? { label: rating, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", c.className)}>
      {c.label}
    </span>
  );
}
