"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/audit/status-badge";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { Engagement } from "@/types";

export default function EngagementsPage() {
  const [search, setSearch] = useState("");
  const { data: engagements = [], isLoading } = useQuery<Engagement[]>({
    queryKey: ["engagements"],
    queryFn: () => api.get("/engagements").then(r => r.data),
  });

  const filtered = engagements.filter(
    e => e.title.toLowerCase().includes(search.toLowerCase()) ||
         e.client_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search engagements…"
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Link href="/engagements/new">
          <Button><Plus className="h-4 w-4 mr-2" />New Engagement</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg font-medium mb-2">No engagements found</p>
          <p className="text-sm">Create your first audit engagement to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(e => (
            <Link key={e.id} href={`/engagements/${e.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 leading-tight">{e.title}</h3>
                    <StatusBadge status={e.status} />
                  </div>
                  <p className="text-sm text-slate-500">{e.client_name}</p>
                  {e.objectives && (
                    <p className="text-xs text-slate-400 line-clamp-2">{e.objectives}</p>
                  )}
                  <div className="flex gap-4 text-xs text-slate-400 pt-1 border-t border-slate-100">
                    <span>{e.start_date ? new Date(e.start_date).toLocaleDateString() : "No start date"}</span>
                    {e.end_date && <span>→ {new Date(e.end_date).toLocaleDateString()}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
