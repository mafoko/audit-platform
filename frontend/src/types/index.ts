export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  firm_name: string | null;
  is_active: boolean;
}

// Match backend EngagementStatus enum exactly
export type EngagementStatus =
  | "DRAFT"
  | "ACTIVE"
  | "EVIDENCE_COLLECTION"
  | "REVIEW"
  | "COMPLETED"
  | "CLOSED";

export interface Engagement {
  id: number;
  title: string;
  client_name: string;
  objectives: string | null;
  scope: string | null;
  start_date: string | null;
  end_date: string | null;
  status: EngagementStatus;
  lead_auditor_id: number;
  created_at: string;
  updated_at: string;
}

export type StandardType =
  | "POLICY"
  | "INTERNATIONAL_STANDARD"
  | "LOCAL_ACT"
  | "INTERNATIONAL_LAW"
  | "CUSTOM";

export interface Standard {
  id: number;
  engagement_id: number;
  name: string;
  type: StandardType;
  content: string | null;
  file_path: string | null;
  created_at: string;
}

export interface Control {
  id: number;
  engagement_id: number;
  standard_id: number | null;
  control_ref: string;
  title: string;
  description: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
}

export type EvidenceStatus = "PENDING" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "OVERDUE";
export type FileReviewStatus = "PENDING" | "COMPLIANT" | "NON_COMPLIANT" | "PARTIAL";

export interface EvidenceRequest {
  id: number;
  engagement_id: number;
  control_id: number | null;
  request_ref: string;
  title: string;
  description: string | null;
  requested_by_id: number;
  requested_at: string;
  deadline_working_hours: number;
  due_at: string | null;
  submitted_at: string | null;
  status: EvidenceStatus;
  is_delayed: boolean;
  delay_hours: number | null;
  notes: string | null;
}

export interface EvidenceFile {
  id: number;
  evidence_request_id: number;
  file_name: string;
  file_size: number;
  file_path: string;
  uploaded_by_id: number;
  uploaded_at: string;
  review_status: FileReviewStatus;
  reviewer_notes: string | null;
}

export type RiskRating = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
export type FindingStatus = "OPEN" | "IN_PROGRESS" | "CLOSED" | "ACCEPTED_RISK";

export interface Finding {
  id: number;
  engagement_id: number;
  control_id: number | null;
  evidence_request_id: number | null;
  finding_ref: string;
  title: string;
  description: string | null;
  root_cause: string | null;
  recommendation: string | null;
  risk_rating: RiskRating;
  custom_rating: string | null;
  management_response: string | null;
  management_response_date: string | null;
  status: FindingStatus;
  created_by_id: number;
  created_at: string;
  updated_at: string;
}

export interface RiskMatrix {
  id: number;
  engagement_id: number;
  name: string;
  levels: Array<{ label: string; color: string; score: number }>;
  is_default: boolean;
}

export type ReportStatus = "DRAFT" | "IN_REVIEW" | "FINAL";

export interface ReportAttestation {
  id: number;
  report_id: number;
  attested_by_id: number;
  role: string;
  attested_at: string;
  signature_note: string | null;
}

export interface Report {
  id: number;
  engagement_id: number;
  title: string;
  executive_summary: string | null;
  methodology: string | null;
  scope_description: string | null;
  status: ReportStatus;
  generated_at: string | null;
  file_path: string | null;
  version: number;
  attestations: ReportAttestation[];
}
