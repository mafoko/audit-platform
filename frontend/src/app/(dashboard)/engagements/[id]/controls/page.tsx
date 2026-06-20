"use client";
import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Wand2 } from "lucide-react";
import type { Control } from "@/types";

interface Props { params: Promise<{ id: string }> }

export default function ControlsPage({ params }: Props) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ control_ref: "", title: "", description: "", category: "" });

  const { data: controls = [], isLoading } = useQuery<Control[]>({
    queryKey: ["controls", id],
    queryFn: () => api.get(`/engagements/${id}/controls`).then(r => r.data),
  });

  const create = useMutation({
    mutationFn: () => api.post(`/engagements/${id}/controls`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["controls", id] });
      setShowNew(false);
      setForm({ control_ref: "", title: "", description: "", category: "" });
    },
  });

  const generate = useMutation({
    mutationFn: () => api.post(`/engagements/${id}/controls/generate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["controls", id] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{controls.length} controls</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => generate.mutate()} disabled={generate.isPending}>
            <Wand2 className="h-4 w-4 mr-2" />{generate.isPending ? "Generating…" : "Generate from Standards"}
          </Button>
          <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-2" />Add Control</Button>
        </div>
      </div>

      {showNew && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader><CardTitle className="text-base">New Control</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Control Ref *</Label>
                <Input placeholder="CTL-001" value={form.control_ref}
                  onChange={e => setForm(p => ({ ...p, control_ref: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input placeholder="e.g. Access Control" value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input placeholder="e.g. User access review must be conducted quarterly" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => create.mutate()} disabled={!form.control_ref || !form.title || create.isPending}>
                {create.isPending ? "Saving…" : "Save Control"}
              </Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : controls.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>No controls defined yet.</p>
          <p className="text-sm mt-1">Add controls manually or generate them from attached standards.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-500 w-28">Ref</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Title</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {controls.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.control_ref}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{c.title}</td>
                  <td className="px-4 py-3 text-slate-500">{c.category ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
