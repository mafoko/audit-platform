export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export type EngagementStatus = "PLANNING" | "FIELDWORK" | "REVIEW" | "COMPLETE";

export interface Engagement {
  id: string;
  title: string;
  client_name: string;
  objectives: string;
  start_date: string;
  end_date: string;
  status: EngagementStatus;
  lead_auditor_id: string;
  created_at: string;
  updated_at: string;
}

export type StandardType = "ISO" | "SOC" | "PCI" | "HIPAA" | "CUSTOM";

export interface Standard {
  id: string;
  engagement_id: string;
  name: string;
  type: StandardType;
  content: string;
  created_at: string;
}

export type ControlStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";

export interface Control {
  id: string;
  engagement_id: string;
  standard_id: string;
  ref_code: string;
  title: string;
  description: string;
  objective: string;
  test_procedure: string;
  assigned_to_id: string | null;
  status: ControlStatus;
  created_at: string;
}

export type EvidenceStatus = "PENDING" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "OVERDUE";

export interface EvidenceRequest {
  id: string;
  engagement_id: string;
  control_id: string | null;
  ref_code: string;
  title: string;
  description: string;
  requested_from: string;
  requested_date: string;
  due_date: string;
  submitted_date: string | null;
  status: EvidenceStatus;
  notes: string | null;
  created_at: string;
}

export interface EvidenceFile {
  id: string;
  evidence_request_id: string;
  filename: string;
  file_size: number;
  content_type: string;
  storage_path: string;
  uploaded_by_id: string;
  uploaded_at: string;
}

export type RiskRating = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
export type FindingStatus = "OPEN" | "IN_REMEDIATION" | "CLOSED" | "ACCEPTED";

export interface Finding {
  id: string;
  engagement_id: string;
  control_id: string | null;
  evidence_request_id: string | null;
  ref_code: string;
  title: string;
  description: string;
  risk_rating: RiskRating;
  status: FindingStatus;
  recommendation: string;
  management_response: string | null;
  due_date: string | null;
  created_at: string;
}

export interface RiskMatrix {
  id: string;
  engagement_id: string;
  likelihood: number;
  impact: number;
  risk_score: number;
}

export type ReportStatus = "DRAFT" | "IN_REVIEW" | "FINAL";

export interface Report {
  id: string;
  engagement_id: string;
  title: string;
  status: ReportStatus;
  content: string;
  generated_at: string;
  finalized_at: string | null;
}

export interface ReportAttestation {
  id: string;
  report_id: string;
  attested_by_id: string;
  attested_at: string;
  role: string;
  comments: string;
}

export interface DashboardStats {
  total_engagements: number;
  active_engagements: number;
  overdue_requests: number;
  open_findings: number;
  findings_by_risk: Record<RiskRating, number>;
  evidence_by_status: Record<EvidenceStatus, number>;
}
