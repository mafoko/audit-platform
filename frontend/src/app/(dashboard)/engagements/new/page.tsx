"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, Plus, Trash2, Check } from "lucide-react";

type Step = 1 | 2 | 3;

interface StandardEntry { name: string; type: string; content: string }

export default function NewEngagementPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    title: "", client_name: "", objectives: "", scope: "",
    start_date: "", end_date: "",
  });
  const [standards, setStandards] = useState<StandardEntry[]>([
    { name: "", type: "INTERNATIONAL_STANDARD", content: "" }
  ]);

  const mutation = useMutation({
    mutationFn: async () => {
      const eng = await api.post("/engagements", {
        title: form.title,
        client_name: form.client_name,
        objectives: form.objectives,
        scope: form.scope,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      });
      const engId = eng.data.id;
      for (const std of standards.filter(s => s.name)) {
        await api.post(`/engagements/${engId}/standards`, std);
      }
      return engId;
    },
    onSuccess: (engId) => {
      qc.invalidateQueries({ queryKey: ["engagements"] });
      router.push(`/engagements/${engId}`);
    },
  });

  const STANDARD_TYPES = [
    "POLICY", "INTERNATIONAL_STANDARD", "LOCAL_ACT", "INTERNATIONAL_LAW", "CUSTOM"
  ];

  function addStandard() {
    setStandards(prev => [...prev, { name: "", type: "INTERNATIONAL_STANDARD", content: "" }]);
  }

  function removeStandard(i: number) {
    setStandards(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateStandard(i: number, field: keyof StandardEntry, value: string) {
    setStandards(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  const steps = [
    { n: 1, label: "Engagement Info" },
    { n: 2, label: "Standards & Scope" },
    { n: 3, label: "Review & Create" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm">
        {steps.map((s, i) => (
          <span key={s.n} className="flex items-center gap-2">
            <span className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold
              ${step >= s.n ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>
              {step > s.n ? <Check className="h-3 w-3" /> : s.n}
            </span>
            <span className={step >= s.n ? "text-slate-900 font-medium" : "text-slate-400"}>{s.label}</span>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300" />}
          </span>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Engagement Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Engagement Title *</Label>
              <Input placeholder="e.g. Google Cloud ISO 27001 Audit 2025"
                value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Client / Auditee Name *</Label>
              <Input placeholder="e.g. Google LLC"
                value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Objectives</Label>
              <Textarea placeholder="State the objectives of this audit…" rows={3}
                value={form.objectives} onChange={e => setForm(p => ({ ...p, objectives: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date}
                  onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date}
                  onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Standards, Policies & Scope</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1.5">
              <Label>Audit Scope</Label>
              <Textarea placeholder="Define the scope of the audit — systems, processes, locations, departments…" rows={3}
                value={form.scope} onChange={e => setForm(p => ({ ...p, scope: e.target.value }))} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Standards & Compliance Frameworks</Label>
                <Button type="button" variant="outline" size="sm" onClick={addStandard}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Add
                </Button>
              </div>
              <div className="space-y-4">
                {standards.map((std, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">Standard {i + 1}</span>
                      {standards.length > 1 && (
                        <button onClick={() => removeStandard(i)} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Name</Label>
                        <Input placeholder="e.g. ISO 27001:2022" value={std.name}
                          onChange={e => updateStandard(i, "name", e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Type</Label>
                        <select
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                          value={std.type}
                          onChange={e => updateStandard(i, "type", e.target.value)}
                        >
                          {STANDARD_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Key Requirements / Description</Label>
                      <Textarea placeholder="Paste key requirements or a summary…" rows={2} value={std.content}
                        onChange={e => updateStandard(i, "content", e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Review & Create</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Row label="Title" value={form.title} />
            <Row label="Client" value={form.client_name} />
            <Row label="Objectives" value={form.objectives} />
            <Row label="Scope" value={form.scope} />
            <Row label="Period" value={[form.start_date, form.end_date].filter(Boolean).join(" → ") || "Not set"} />
            <div>
              <span className="text-slate-500 font-medium">Standards:</span>
              <ul className="mt-1 space-y-0.5">
                {standards.filter(s => s.name).map((s, i) => (
                  <li key={i} className="text-slate-700">• {s.name} <span className="text-slate-400 text-xs">({s.type})</span></li>
                ))}
              </ul>
            </div>
            {mutation.isError && <p className="text-red-600">Failed to create engagement. Please try again.</p>}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step > 1 ? setStep(s => (s - 1) as Step) : router.back()}
          disabled={mutation.isPending}>
          <ChevronLeft className="h-4 w-4 mr-1" />{step === 1 ? "Cancel" : "Back"}
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep(s => (s + 1) as Step)}
            disabled={step === 1 && (!form.title || !form.client_name)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create Engagement"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-slate-500 font-medium">{label}: </span>
      <span className="text-slate-800">{value || <em className="text-slate-400">Not provided</em>}</span>
    </div>
  );
}
