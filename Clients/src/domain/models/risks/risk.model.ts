export class RiskModel {
  id?: number;
  risk_name!: string;
  risk_owner!: number;
  ai_lifecycle_phase!:
    | "Problem definition & planning"
    | "Data collection & processing"
    | "Model development & training"
    | "Model validation & testing"
    | "Deployment & integration"
    | "Monitoring & maintenance"
    | "Decommissioning & retirement";
  risk_description!: string;
  risk_category!: string[];
  impact!: string;
  assessment_mapping!: string;
  controls_mapping!: string;
  likelihood!: "Rare" | "Unlikely" | "Possible" | "Likely" | "Almost Certain";
  severity!: "Negligible" | "Minor" | "Moderate" | "Major" | "Catastrophic";
  risk_level_autocalculated!:
    | "No risk"
    | "Very low risk"
    | "Low risk"
    | "Medium risk"
    | "High risk"
    | "Very high risk";
  review_notes!: string;
  mitigation_status!:
    | "Not Started"
    | "In Progress"
    | "Completed"
    | "On Hold"
    | "Deferred"
    | "Canceled"
    | "Requires review";
  current_risk_level!:
    | "Very Low risk"
    | "Low risk"
    | "Medium risk"
    | "High risk"
    | "Very high risk";
  deadline!: Date;
  mitigation_plan!: string;
  implementation_strategy!: string;
  mitigation_evidence_document!: string;
  likelihood_mitigation!:
    | "Rare"
    | "Unlikely"
    | "Possible"
    | "Likely"
    | "Almost Certain";
  risk_severity!: "Negligible" | "Minor" | "Moderate" | "Major" | "Critical";
  final_risk_level!: string;
  risk_approval!: number;
  approval_status!: string;
  date_of_assessment!: Date;
  is_demo?: boolean;
  created_at?: Date;

  constructor(data: RiskModel) {
    this.id = data.id;
    this.risk_name = data.risk_name;
    this.risk_owner = data.risk_owner;
    this.ai_lifecycle_phase = data.ai_lifecycle_phase;
    this.risk_description = data.risk_description;
    this.risk_category = data.risk_category;
    this.impact = data.impact;
    this.assessment_mapping = data.assessment_mapping;
    this.controls_mapping = data.controls_mapping;
    this.likelihood = data.likelihood;
    this.severity = data.severity;
    this.risk_level_autocalculated = data.risk_level_autocalculated;
    this.review_notes = data.review_notes;
    this.mitigation_status = data.mitigation_status;
    this.current_risk_level = data.current_risk_level;
    this.deadline = data.deadline;
    this.mitigation_plan = data.mitigation_plan;
    this.implementation_strategy = data.implementation_strategy;
    this.mitigation_evidence_document = data.mitigation_evidence_document;
    this.likelihood_mitigation = data.likelihood_mitigation;
    this.risk_severity = data.risk_severity;
    this.final_risk_level = data.final_risk_level;
    this.risk_approval = data.risk_approval;
    this.approval_status = data.approval_status;
    this.date_of_assessment = data.date_of_assessment;
    this.is_demo = data.is_demo;
    this.created_at = data.created_at;
  }

  static createNewRisk(data: RiskModel): RiskModel {
    return new RiskModel(data);
  }
}
