import { cn } from "@/lib/utils";

const engagementConfig: Record<string, string> = {
  DRAFT:               "bg-slate-100 text-slate-600",
  ACTIVE:              "bg-green-100 text-green-700",
  EVIDENCE_COLLECTION: "bg-blue-100 text-blue-700",
  REVIEW:              "bg-purple-100 text-purple-700",
  COMPLETED:           "bg-teal-100 text-teal-700",
  CLOSED:              "bg-slate-200 text-slate-500",
};

const evidenceConfig: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  ACCEPTED:  "bg-green-100 text-green-700",
  REJECTED:  "bg-red-100 text-red-700",
  OVERDUE:   "bg-red-100 text-red-800",
};

const findingConfig: Record<string, string> = {
  OPEN:          "bg-red-100 text-red-700",
  IN_PROGRESS:   "bg-blue-100 text-blue-700",
  CLOSED:        "bg-green-100 text-green-700",
  ACCEPTED_RISK: "bg-orange-100 text-orange-700",
};

type StatusType = "engagement" | "evidence" | "finding";

export function StatusBadge({ status, type = "engagement" }: { status: string; type?: StatusType }) {
  const map = type === "evidence" ? evidenceConfig : type === "finding" ? findingConfig : engagementConfig;
  const cls = map[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", cls)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
