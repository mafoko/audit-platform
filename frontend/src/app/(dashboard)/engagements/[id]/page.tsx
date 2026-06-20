"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { Engagement, Standard, Control, EvidenceRequest, Finding, Report } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/audit/status-badge";
import { RiskBadge } from "@/components/audit/risk-badge";
import { DeadlineCountdown } from "@/components/audit/deadline-countdown";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Zap, FileText, Download } from "lucide-react";

export default function EngagementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: engagement, isLoading } = useQuery<Engagement>({
    queryKey: ["engagement", id],
    queryFn: () => api.get(`/engagements/${id}`).then(r => r.data),
  });

  const { data: standards = [] } = useQuery<Standard[]>({
    queryKey: ["standards", id],
    queryFn: () => api.get(`/engagements/${id}/standards`).then(r => r.data),
  });

  const { data: controls = [] } = useQuery<Control[]>({
    queryKey: ["controls", id],
    queryFn: () => api.get(`/engagements/${id}/controls`).then(r => r.data),
  });

  const { data: evidenceRequests = [] } = useQuery<EvidenceRequest[]>({
    queryKey: ["evidence-requests", id],
    queryFn: () => api.get(`/engagements/${id}/evidence-requests`).then(r => r.data),
  });

  const { data: findings = [] } = useQuery<Finding[]>({
    queryKey: ["findings", id],
    queryFn: () => api.get(`/engagements/${id}/findings`).then(r => r.data),
  });

  const { data: report } = useQuery<Report>({
    queryKey: ["report", id],
    queryFn: () => api.get(`/engagements/${id}/report`).then(r => r.data),
    retry: false,
  });

  const generateControlsMutation = useMutation({
    mutationFn: () => api.post(`/engagements/${id}/controls/generate`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["controls", id] }),
  });

  const generateReportMutation = useMutation({
    mutationFn: () => api.post(`/engagements/${id}/report/generate`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report", id] }),
  });

  // Add Standard dialog state
  const [stdOpen, setStdOpen] = useState(false);
  const [stdForm, setStdForm] = useState({ name: "", type: "ISO", content: "" });

  const addStandardMutation = useMutation({
    mutationFn: () => api.post("/standards", { ...stdForm, engagement_id: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["standards", id] });
      setStdOpen(false);
      setStdForm({ name: "", type: "ISO", content: "" });
    },
  });

  const controlsComplete = controls.filter(c => c.status === "COMPLETE").length;
  const controlsProgress = controls.length > 0 ? Math.round((controlsComplete / controls.length) * 100) : 0;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading engagement…</div>;
  }

  if (!engagement) {
    return <div className="text-center py-16 text-muted-foreground">Engagement not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{engagement.title}</h2>
        <p className="text-muted-foreground">{engagement.client_name}</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="standards">Standards ({standards.length})</TabsTrigger>
          <TabsTrigger value="controls">Controls ({controls.length})</TabsTrigger>
          <TabsTrigger value="evidence">Evidence ({evidenceRequests.length})</TabsTrigger>
          <TabsTrigger value="findings">Findings ({findings.length})</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle></CardHeader>
              <CardContent>
                <StatusBadge status={engagement.status} type="engagement" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Period</CardTitle></CardHeader>
              <CardContent className="text-sm">
                {format(new Date(engagement.start_date), "MMM d, yyyy")} — {format(new Date(engagement.end_date), "MMM d, yyyy")}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Objectives</CardTitle></CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">{engagement.objectives || "No objectives set."}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Controls Progress</CardTitle>
                <span className="text-xs text-muted-foreground">{controlsComplete}/{controls.length}</span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={controlsProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{controlsProgress}% complete</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STANDARDS */}
        <TabsContent value="standards" className="mt-4">
          <div className="flex justify-end mb-3">
            <Dialog open={stdOpen} onOpenChange={setStdOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Standard</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Standard</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input value={stdForm.name} onChange={e => setStdForm(p => ({ ...p, name: e.target.value }))} placeholder="ISO 27001:2022" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select value={stdForm.type} onValueChange={v => setStdForm(p => ({ ...p, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["ISO","SOC","PCI","HIPAA","CUSTOM"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Content</Label>
                    <Textarea value={stdForm.content} onChange={e => setStdForm(p => ({ ...p, content: e.target.value }))} rows={4} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setStdOpen(false)}>Cancel</Button>
                  <Button onClick={() => addStandardMutation.mutate()} disabled={!stdForm.name || addStandardMutation.isPending}>
                    {addStandardMutation.isPending ? "Adding…" : "Add Standard"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">
            {standards.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No standards added yet.</p>
            ) : standards.map(std => (
              <Card key={std.id}>
                <CardContent className="pt-4 flex items-start justify-between">
                  <div>
                    <p className="font-medium">{std.name}</p>
                    {std.content && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{std.content}</p>}
                  </div>
                  <Badge variant="outline">{std.type}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* CONTROLS */}
        <TabsContent value="controls" className="mt-4">
          <div className="flex gap-2 justify-end mb-3">
            <Button size="sm" variant="outline" onClick={() => generateControlsMutation.mutate()} disabled={generateControlsMutation.isPending}>
              <Zap className="h-4 w-4 mr-1" />{generateControlsMutation.isPending ? "Generating…" : "Generate Controls"}
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Objective</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {controls.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No controls yet.</TableCell></TableRow>
              ) : controls.map(ctrl => (
                <TableRow key={ctrl.id}>
                  <TableCell className="font-mono text-xs">{ctrl.ref_code}</TableCell>
                  <TableCell className="font-medium">{ctrl.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{ctrl.objective}</TableCell>
                  <TableCell><StatusBadge status={ctrl.status} type="engagement" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* EVIDENCE */}
        <TabsContent value="evidence" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Requested From</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Time Left</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evidenceRequests.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No evidence requests.</TableCell></TableRow>
              ) : evidenceRequests.map(er => (
                <TableRow key={er.id}>
                  <TableCell className="font-mono text-xs">{er.ref_code}</TableCell>
                  <TableCell className="font-medium">{er.title}</TableCell>
                  <TableCell className="text-sm">{er.requested_from}</TableCell>
                  <TableCell className="text-sm">{format(new Date(er.due_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <DeadlineCountdown dueAt={er.due_date} submittedAt={er.submitted_date} />
                  </TableCell>
                  <TableCell><StatusBadge status={er.status} type="evidence" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* FINDINGS */}
        <TabsContent value="findings" className="mt-4">
          <div className="grid grid-cols-5 gap-2 mb-4">
            {(["CRITICAL","HIGH","MEDIUM","LOW","INFORMATIONAL"] as const).map(r => {
              const count = findings.filter(f => f.risk_rating === r).length;
              return (
                <Card key={r} className="text-center">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-2xl font-bold">{count}</p>
                    <RiskBadge rating={r} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {findings.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No findings.</TableCell></TableRow>
              ) : findings.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-xs">{f.ref_code}</TableCell>
                  <TableCell className="font-medium">{f.title}</TableCell>
                  <TableCell><RiskBadge rating={f.risk_rating} /></TableCell>
                  <TableCell><StatusBadge status={f.status} type="finding" /></TableCell>
                  <TableCell className="text-sm">{f.due_date ? format(new Date(f.due_date), "MMM d, yyyy") : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* REPORT */}
        <TabsContent value="report" className="mt-4">
          {!report ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No report generated yet.</p>
                <Button onClick={() => generateReportMutation.mutate()} disabled={generateReportMutation.isPending}>
                  {generateReportMutation.isPending ? "Generating…" : "Generate Report"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{report.title}</CardTitle>
                  <StatusBadge status={report.status} type="engagement" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Generated: {format(new Date(report.generated_at), "MMM d, yyyy HH:mm")}
                </p>
                <Button variant="outline" size="sm" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/reports/${report.id}/download`, "_blank")}>
                  <Download className="h-4 w-4 mr-1" />Download Report
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
