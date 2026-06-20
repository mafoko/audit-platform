"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { Finding, Control, EvidenceRequest } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge } from "@/components/audit/risk-badge";
import { StatusBadge } from "@/components/audit/status-badge";
import { Plus } from "lucide-react";

const RISK_RATINGS = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"] as const;
const FINDING_STATUSES = ["OPEN", "IN_REMEDIATION", "CLOSED", "ACCEPTED"] as const;

export default function FindingsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", risk_rating: "HIGH", status: "OPEN",
    recommendation: "", management_response: "", due_date: "",
    control_id: "", evidence_request_id: "",
  });

  const { data: findings = [], isLoading } = useQuery<Finding[]>({
    queryKey: ["findings", id],
    queryFn: () => api.get(`/engagements/${id}/findings`).then(r => r.data),
  });

  const { data: controls = [] } = useQuery<Control[]>({
    queryKey: ["controls", id],
    queryFn: () => api.get(`/engagements/${id}/controls`).then(r => r.data),
  });

  const { data: evidenceRequests = [] } = useQuery<EvidenceRequest[]>({
    queryKey: ["evidence-requests", id],
    queryFn: () => api.get(`/engagements/${id}/evidence-requests`).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/findings", {
      ...form,
      engagement_id: id,
      control_id: form.control_id || null,
      evidence_request_id: form.evidence_request_id || null,
      due_date: form.due_date || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["findings", id] });
      setOpen(false);
      setForm({ title: "", description: "", risk_rating: "HIGH", status: "OPEN", recommendation: "", management_response: "", due_date: "", control_id: "", evidence_request_id: "" });
    },
  });

  const riskCounts = RISK_RATINGS.reduce((acc, r) => {
    acc[r] = findings.filter(f => f.risk_rating === r).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Findings</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Finding</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Finding</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Description *</Label>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Risk Rating</Label>
                  <Select value={form.risk_rating} onValueChange={v => setForm(p => ({ ...p, risk_rating: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RISK_RATINGS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FINDING_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Recommendation</Label>
                <Textarea value={form.recommendation} onChange={e => setForm(p => ({ ...p, recommendation: e.target.value }))} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Management Response</Label>
                <Textarea value={form.management_response} onChange={e => setForm(p => ({ ...p, management_response: e.target.value }))} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              {controls.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Related Control (optional)</Label>
                  <Select value={form.control_id} onValueChange={v => setForm(p => ({ ...p, control_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select control…" /></SelectTrigger>
                    <SelectContent>
                      {controls.map(c => <SelectItem key={c.id} value={c.id}>{c.ref_code} — {c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {evidenceRequests.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Related Evidence Request (optional)</Label>
                  <Select value={form.evidence_request_id} onValueChange={v => setForm(p => ({ ...p, evidence_request_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select evidence request…" /></SelectTrigger>
                    <SelectContent>
                      {evidenceRequests.map(er => <SelectItem key={er.id} value={er.id}>{er.ref_code} — {er.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={!form.title || !form.description || createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create Finding"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Risk distribution */}
      <div className="grid grid-cols-5 gap-3">
        {RISK_RATINGS.map(r => (
          <Card key={r} className="text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold mb-1">{riskCounts[r]}</p>
              <RiskBadge rating={r} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ref</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Risk Rating</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
          ) : findings.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No findings yet.</TableCell></TableRow>
          ) : findings.map(f => (
            <TableRow key={f.id}>
              <TableCell className="font-mono text-xs">{f.ref_code}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{f.title}</p>
                  {f.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{f.description}</p>}
                </div>
              </TableCell>
              <TableCell><RiskBadge rating={f.risk_rating} /></TableCell>
              <TableCell><StatusBadge status={f.status} type="finding" /></TableCell>
              <TableCell className="text-sm">{f.due_date ? format(new Date(f.due_date), "MMM d, yyyy") : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
