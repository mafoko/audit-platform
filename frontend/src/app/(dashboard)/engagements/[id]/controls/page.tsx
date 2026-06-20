"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Control, Standard } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Zap, ChevronDown, ChevronUp } from "lucide-react";

export default function ControlsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    control_ref: "", title: "", description: "", category: "", standard_id: "",
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
    mutationFn: () => api.post(`/engagements/${id}/controls`, {
      control_ref: form.control_ref,
      title: form.title,
      description: form.description || null,
      category: form.category || null,
      standard_id: form.standard_id ? parseInt(form.standard_id) : null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["controls", id] });
      setOpen(false);
      setForm({ control_ref: "", title: "", description: "", category: "", standard_id: "" });
    },
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
                    <Input value={form.control_ref} onChange={e => setForm(p => ({ ...p, control_ref: e.target.value }))} placeholder="e.g. ISO-A.9.1" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Access Control" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} />
                </div>
                {standards.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Standard (optional)</Label>
                    <Select value={form.standard_id} onValueChange={v => setForm(p => ({ ...p, standard_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select standard…" /></SelectTrigger>
                      <SelectContent>
                        {standards.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => createMutation.mutate()} disabled={!form.control_ref || !form.title || createMutation.isPending}>
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
            <TableHead>Category</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
          ) : controls.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No controls yet. Generate or add controls to get started.</TableCell></TableRow>
          ) : controls.map(ctrl => (
            <React.Fragment key={ctrl.id}>
              <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedId(expandedId === ctrl.id ? null : ctrl.id)}>
                <TableCell>
                  {expandedId === ctrl.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </TableCell>
                <TableCell className="font-mono text-xs">{ctrl.control_ref}</TableCell>
                <TableCell className="font-medium">{ctrl.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{ctrl.category ?? "—"}</TableCell>
              </TableRow>
              {expandedId === ctrl.id && (
                <TableRow>
                  <TableCell colSpan={4} className="bg-slate-50 px-6 py-4">
                    <div className="space-y-3 text-sm">
                      {ctrl.description && (
                        <div>
                          <p className="font-medium text-slate-700 mb-1">Description</p>
                          <p className="text-slate-600 whitespace-pre-wrap">{ctrl.description}</p>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
