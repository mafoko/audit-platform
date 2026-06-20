"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FindingsChart } from "@/components/audit/findings-chart";
import { StatusBadge } from "@/components/audit/status-badge";
import { Briefcase, FileCheck, AlertTriangle, CheckCircle } from "lucide-react";
import type { Engagement, Finding, EvidenceRequest } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";

export default function DashboardPage() {
  const { data: engagements = [] } = useQuery<Engagement[]>({
    queryKey: ["engagements"],
    queryFn: () => api.get("/engagements").then(r => r.data),
  });

  const activeCount = engagements.filter(e => e.status === "ACTIVE" || e.status === "EVIDENCE_COLLECTION").length;

  const evidenceStatusData = [
    { name: "Pending", value: 12 },
    { name: "Submitted", value: 8 },
    { name: "Accepted", value: 20 },
    { name: "Overdue", value: 3 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<Briefcase className="h-5 w-5 text-blue-600" />} label="Total Engagements" value={engagements.length} bg="bg-blue-50" />
        <StatCard icon={<CheckCircle className="h-5 w-5 text-green-600" />} label="Active Engagements" value={activeCount} bg="bg-green-50" />
        <StatCard icon={<FileCheck className="h-5 w-5 text-amber-600" />} label="Overdue Evidence" value={3} bg="bg-amber-50" />
        <StatCard icon={<AlertTriangle className="h-5 w-5 text-red-600" />} label="Open Findings" value={7} bg="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Findings by Risk Level</CardTitle></CardHeader>
          <CardContent>
            <FindingsChart findings={[
              { risk_rating: "CRITICAL" }, { risk_rating: "CRITICAL" },
              { risk_rating: "HIGH" }, { risk_rating: "HIGH" }, { risk_rating: "HIGH" },
              { risk_rating: "MEDIUM" }, { risk_rating: "MEDIUM" }, { risk_rating: "MEDIUM" }, { risk_rating: "MEDIUM" },
              { risk_rating: "LOW" }, { risk_rating: "LOW" },
              { risk_rating: "INFORMATIONAL" },
            ] as Finding[]} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Evidence Request Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={evidenceStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Engagements</CardTitle></CardHeader>
        <CardContent>
          {engagements.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No engagements yet. <Link href="/engagements/new" className="text-blue-600 hover:underline">Create one</Link></p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-3 pr-4 font-medium text-slate-500">Title</th>
                  <th className="pb-3 pr-4 font-medium text-slate-500">Client</th>
                  <th className="pb-3 pr-4 font-medium text-slate-500">Status</th>
                  <th className="pb-3 font-medium text-slate-500">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {engagements.slice(0, 5).map(e => (
                  <tr key={e.id}>
                    <td className="py-3 pr-4">
                      <Link href={`/engagements/${e.id}`} className="text-blue-600 hover:underline font-medium">{e.title}</Link>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{e.client_name}</td>
                    <td className="py-3 pr-4"><StatusBadge status={e.status} /></td>
                    <td className="py-3 text-slate-500">{e.start_date ? new Date(e.start_date).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`${bg} rounded-xl p-3`}>{icon}</div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
