"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { EvidenceRequest, Control } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/audit/status-badge";
import { DeadlineCountdown } from "@/components/audit/deadline-countdown";
import { EvidenceUpload } from "@/components/audit/evidence-upload";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function EvidencePage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EvidenceRequest | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", request_ref: "", deadline_working_hours: "48", control_id: "",
  });

  const { data: evidenceRequests = [], isLoading } = useQuery<EvidenceRequest[]>({
    queryKey: ["evidence-requests", id],
    queryFn: () => api.get(`/engagements/${id}/evidence-requests`).then(r => r.data),
  });

  const { data: controls = [] } = useQuery<Control[]>({
    queryKey: ["controls", id],
    queryFn: () => api.get(`/engagements/${id}/controls`).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post(`/engagements/${id}/evidence-requests`, {
      request_ref: form.request_ref,
      title: form.title,
      description: form.description || null,
      deadline_working_hours: parseInt(form.deadline_working_hours) || 48,
      control_id: form.control_id ? parseInt(form.control_id) : null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evidence-requests", id] });
      setOpen(false);
      setForm({ title: "", description: "", request_ref: "", deadline_working_hours: "48", control_id: "" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Evidence Requests</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Request</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Evidence Request</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Request Ref *</Label>
                <Input value={form.request_ref} onChange={e => setForm(p => ({ ...p, request_ref: e.target.value }))} placeholder="e.g. PBC-001" />
              </div>
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Evidence title" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Deadline (working hours) *</Label>
                <Input type="number" min="1" value={form.deadline_working_hours} onChange={e => setForm(p => ({ ...p, deadline_working_hours: e.target.value }))} placeholder="48" />
              </div>
              {controls.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Related Control (optional)</Label>
                  <Select value={form.control_id} onValueChange={v => setForm(p => ({ ...p, control_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select control…" /></SelectTrigger>
                    <SelectContent>
                      {controls.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.control_ref} — {c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={!form.title || !form.request_ref || createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Deadline (hrs)</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Time Remaining</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : evidenceRequests.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No evidence requests.</TableCell></TableRow>
              ) : evidenceRequests.map(er => (
                <TableRow
                  key={er.id}
                  className={`cursor-pointer ${selectedRequest?.id === er.id ? "bg-blue-50" : ""}`}
                  onClick={() => setSelectedRequest(selectedRequest?.id === er.id ? null : er)}
                >
                  <TableCell className="font-mono text-xs">{er.request_ref}</TableCell>
                  <TableCell className="font-medium">{er.title}</TableCell>
                  <TableCell className="text-sm">{er.deadline_working_hours}h</TableCell>
                  <TableCell className="text-sm">{er.due_at ? format(new Date(er.due_at), "MMM d, yyyy") : "—"}</TableCell>
                  <TableCell>
                    <DeadlineCountdown dueAt={er.due_at} submittedAt={er.submitted_at} />
                  </TableCell>
                  <TableCell><StatusBadge status={er.status} type="evidence" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          {selectedRequest ? (
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <p className="font-semibold">{selectedRequest.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedRequest.request_ref}</p>
                </div>
                {selectedRequest.description && (
                  <p className="text-sm">{selectedRequest.description}</p>
                )}
                {selectedRequest.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">
                    {selectedRequest.notes}
                  </div>
                )}
                <EvidenceUpload
                  requestId={selectedRequest.id}
                  onUploaded={() => qc.invalidateQueries({ queryKey: ["evidence-requests", id] })}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12 text-center text-muted-foreground text-sm">
                Click a row to view details and upload files.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
