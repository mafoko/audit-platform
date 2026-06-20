"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { Control, Standard } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/audit/status-badge";
import { Plus, Zap, ChevronDown, ChevronUp } from "lucide-react";

const CONTROL_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETE"] as const;

export default function ControlsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    ref_code: "", title: "", description: "", objective: "",
    test_procedure: "", standard_id: "", status: "NOT_STARTED",
  });

  const { data: controls = [], isLoading } = useQuery<Control[]>({
    queryKey: ["controls", id],
    queryFn: () => api.get(`/engagements/${id}/controls`).then(r => r.data),
  });

  const { data: standards = [] } = useQuery<Standard[]>({
    queryKey: ["standards", id],
    queryFn: () => api.get(`/engagements/${id}/standards`).then(r => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post(`/engagements/${id}/controls/generate`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["controls", id] }),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/controls", { ...form, engagement_id: id, standard_id: form.standard_id || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["controls", id] });
      setOpen(false);
      setForm({ ref_code: "", title: "", description: "", objective: "", test_procedure: "", standard_id: "", status: "NOT_STARTED" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ controlId, status }: { controlId: string; status: string }) =>
      api.patch(`/controls/${controlId}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["controls", id] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Controls ({controls.length})</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            <Zap className="h-4 w-4 mr-1" />
            {generateMutation.isPending ? "Generating…" : "Generate Controls"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Control</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Control</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Ref Code *</Label>
                    <Input value={form.ref_code} onChange={e => setForm(p => ({ ...p, ref_code: e.target.value }))} placeholder="e.g. ISO-A.9.1" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONTROL_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>Objective</Label>
                  <Textarea value={form.objective} onChange={e => setForm(p => ({ ...p, objective: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>Test Procedure</Label>
                  <Textarea value={form.test_procedure} onChange={e => setForm(p => ({ ...p, test_procedure: e.target.value }))} rows={3} placeholder="Describe the testing steps…" />
                </div>
                {standards.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Standard (optional)</Label>
                    <Select value={form.standard_id} onValueChange={v => setForm(p => ({ ...p, standard_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select standard…" /></SelectTrigger>
                      <SelectContent>
                        {standards.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => createMutation.mutate()} disabled={!form.ref_code || !form.title || createMutation.isPending}>
                  {createMutation.isPending ? "Adding…" : "Add Control"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Ref Code</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Objective</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
          ) : controls.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No controls yet. Generate or add controls to get started.</TableCell></TableRow>
          ) : controls.map(ctrl => (
            <>
              <TableRow key={ctrl.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedId(expandedId === ctrl.id ? null : ctrl.id)}>
                <TableCell>
                  {expandedId === ctrl.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </TableCell>
                <TableCell className="font-mono text-xs">{ctrl.ref_code}</TableCell>
                <TableCell className="font-medium">{ctrl.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{ctrl.objective}</TableCell>
                <TableCell><StatusBadge status={ctrl.status} type="engagement" /></TableCell>
                <TableCell>
                  <Select
                    value={ctrl.status}
                    onValueChange={v => updateStatusMutation.mutate({ controlId: ctrl.id, status: v })}
                  >
                    <SelectTrigger className="h-8 w-36 text-xs" onClick={e => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTROL_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
              {expandedId === ctrl.id && (
                <TableRow key={`${ctrl.id}-expanded`}>
                  <TableCell colSpan={6} className="bg-slate-50 px-6 py-4">
                    <div className="space-y-3 text-sm">
                      {ctrl.description && (
                        <div>
                          <p className="font-medium text-slate-700 mb-1">Description</p>
                          <p className="text-slate-600">{ctrl.description}</p>
                        </div>
                      )}
                      {ctrl.test_procedure && (
                        <div>
                          <p className="font-medium text-slate-700 mb-1">Test Procedure</p>
                          <p className="text-slate-600 whitespace-pre-wrap">{ctrl.test_procedure}</p>
                        </div>
                      )}
                      {ctrl.objective && (
                        <div>
                          <p className="font-medium text-slate-700 mb-1">Objective</p>
                          <p className="text-slate-600">{ctrl.objective}</p>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
