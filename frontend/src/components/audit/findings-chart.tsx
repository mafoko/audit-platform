"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Finding } from "@/types";

const COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#f59e0b",
  LOW: "#3b82f6",
  INFORMATIONAL: "#94a3b8",
};

interface Props {
  findings: Finding[];
}

export function FindingsChart({ findings }: Props) {
  const counts = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.risk_rating] = (acc[f.risk_rating] ?? 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">No findings yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map(entry => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [v, "Findings"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
