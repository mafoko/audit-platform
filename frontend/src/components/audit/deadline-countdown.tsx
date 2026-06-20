"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Clock, AlertCircle } from "lucide-react";

interface Props {
  dueAt: string;
  submittedAt?: string | null;
  isDelayed?: boolean;
  delayHours?: number | null;
}

function getWorkingHoursRemaining(dueAt: Date): number {
  const now = new Date();
  if (now >= dueAt) return 0;
  const diffMs = dueAt.getTime() - now.getTime();
  return diffMs / (1000 * 60 * 60);
}

export function DeadlineCountdown({ dueAt, submittedAt, isDelayed, delayHours }: Props) {
  const due = new Date(dueAt);
  const [remaining, setRemaining] = useState(() => getWorkingHoursRemaining(due));

  useEffect(() => {
    if (submittedAt) return;
    const id = setInterval(() => setRemaining(getWorkingHoursRemaining(due)), 60000);
    return () => clearInterval(id);
  }, [dueAt, submittedAt]);

  if (submittedAt) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs font-medium", isDelayed ? "text-red-600" : "text-green-600")}>
        {isDelayed ? (
          <><AlertCircle className="h-3 w-3" />Delayed by {delayHours?.toFixed(1)}h</>
        ) : (
          <><Clock className="h-3 w-3" />On time</>
        )}
      </span>
    );
  }

  const overdue = remaining <= 0;
  const urgency = overdue ? "red" : remaining < 8 ? "red" : remaining < 24 ? "yellow" : "green";

  const hrs = Math.floor(Math.abs(remaining));
  const mins = Math.round((Math.abs(remaining) - hrs) * 60);

  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
      urgency === "red"    && "bg-red-100 text-red-700",
      urgency === "yellow" && "bg-amber-100 text-amber-700",
      urgency === "green"  && "bg-green-100 text-green-700",
    )}>
      <Clock className="h-3 w-3" />
      {overdue ? `Overdue by ${hrs}h ${mins}m` : `${hrs}h ${mins}m left`}
    </span>
  );
}
