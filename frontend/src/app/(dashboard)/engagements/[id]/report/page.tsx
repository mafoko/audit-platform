"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { Report, ReportAttestation, Finding } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/audit/status-badge";
import { RiskBadge } from "@/components/audit/risk-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, CheckCircle, Send } from "lucide-react";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [attestOpen, setAttestOpen] = useState(false);
  const [attestForm, setAttestForm] = useState({ role: "", signature_note: "" });

  const { data: report, isLoading } = useQuery<Report>({
    queryKey: ["report", id],
    queryFn: () => api.get(`/engagements/${id}/report`).then(r => r.data),
    retry: false,
  });

  const { data: findings = [] } = useQuery<Finding[]>({
    queryKey: ["findings", id],
    queryFn: () => api.get(`/engagements/${id}/findings`).then(r => r.data),
  });

  const { data: attestations = [] } = useQuery<ReportAttestation[]>({
    queryKey: ["attestations", report?.id],
    queryFn: () => api.get(`/reports/${report!.id}/attestations`).then(r => r.data),
    enabled: !!report?.id,
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post(`/engagements/${id}/report/generate`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report", id] }),
  });

  const submitReviewMutation = useMutation({
    mutationFn: () => api.patch(`/reports/${report!.id}`, { status: "IN_REVIEW" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report", id] }),
  });

  const finalizeMutation = useMutation({
    mutationFn: () => api.patch(`/reports/${report!.id}`, { status: "FINAL" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report", id] }),
  });

  const attestMutation = useMutation({
    mutationFn: () => api.post(`/reports/${report!.id}/attest`, attestForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attestations", report?.id] });
      setAttestOpen(false);
      setAttestForm({ role: "", signature_note: "" });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
          <FileText className="h-16 w-16 text-muted-foreground" />
          <p className="text-lg font-medium">No report generated yet</p>
          <p className="text-sm text-muted-foreground">Generate a report to summarize findings and evidence for this engagement.</p>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? "Generating…" : "Generate Report"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{report.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Generated: {format(new Date(report.generated_at), "MMM d, yyyy HH:mm")}
              </p>
            </div>
            <StatusBadge status={report.status} type="engagement" />
          </div>
        </CardHeader>
        <CardContent>
          {/* Status progression */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex items-center gap-1.5 text-sm font-medium ${report.status !== "DRAFT" ? "text-green-600" : "text-blue-600"}`}>
              <CheckCircle className={`h-4 w-4 ${report.status !== "DRAFT" ? "text-green-600" : "text-blue-400"}`} />
              Draft
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center gap-1.5 text-sm font-medium ${report.status === "FINAL" ? "text-green-600" : report.status === "IN_REVIEW" ? "text-blue-600" : "text-muted-foreground"}`}>
              <CheckCircle className={`h-4 w-4 ${report.status === "FINAL" || report.status === "IN_REVIEW" ? "" : "opacity-30"}`} />
              In Review
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center gap-1.5 text-sm font-medium ${report.status === "FINAL" ? "text-green-600" : "text-muted-foreground"}`}>
              <CheckCircle className={`h-4 w-4 ${report.status === "FINAL" ? "" : "opacity-30"}`} />
              Final
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {report.status === "DRAFT" && (
              <Button size="sm" onClick={() => submitReviewMutation.mutate()} disabled={submitReviewMutation.isPending}>
                <Send className="h-4 w-4 mr-1" />
                {submitReviewMutation.isPending ? "Submitting…" : "Submit for Review"}
              </Button>
            )}
            {report.status === "IN_REVIEW" && (
              <Button size="sm" onClick={() => finalizeMutation.mutate()} disabled={finalizeMutation.isPending}>
                <CheckCircle className="h-4 w-4 mr-1" />
                {finalizeMutation.isPending ? "Finalizing…" : "Finalize Report"}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/reports/${report.id}/download`, "_blank")}>
              <Download className="h-4 w-4 mr-1" />Download
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Findings summary */}
      <Card>
        <CardHeader><CardTitle className="text-base">Findings Summary</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {findings.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No findings.</TableCell></TableRow>
              ) : findings.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-xs">{f.finding_ref}</TableCell>
                  <TableCell className="font-medium">{f.title}</TableCell>
                  <TableCell><RiskBadge rating={f.risk_rating} /></TableCell>
                  <TableCell><StatusBadge status={f.status} type="finding" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Attestations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Attestations</CardTitle>
            <Dialog open={attestOpen} onOpenChange={setAttestOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <CheckCircle className="h-4 w-4 mr-1" />Attest
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Attest Report</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Your Role *</Label>
                    <Input value={attestForm.role} onChange={e => setAttestForm(p => ({ ...p, role: e.target.value }))} placeholder="e.g. Lead Auditor, Manager" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Signature Note</Label>
                    <Textarea value={attestForm.signature_note} onChange={e => setAttestForm(p => ({ ...p, signature_note: e.target.value }))} rows={4} placeholder="Add any comments about this attestation…" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAttestOpen(false)}>Cancel</Button>
                  <Button onClick={() => attestMutation.mutate()} disabled={!attestForm.role || attestMutation.isPending}>
                    {attestMutation.isPending ? "Attesting…" : "Submit Attestation"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {attestations.length === 0 ? (
            <p className="text-center py-6 text-sm text-muted-foreground">No attestations yet.</p>
          ) : (
            <div className="space-y-3">
              {attestations.map(att => (
                <div key={att.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{att.role}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(att.attested_at), "MMM d, yyyy HH:mm")}</span>
                  </div>
                  {att.signature_note && <p className="text-sm text-muted-foreground">{att.signature_note}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
