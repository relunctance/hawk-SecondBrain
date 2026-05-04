/**
 * TypeScript type definitions for hawk-secondbrain
 */

/** Configuration for HawkMemoryClient */
export interface ClientConfig {
  baseUrl: string;
  apiKey?: string;
  agentId: string;
  timeoutMs: number;
  retryConfig?: RetryConfig;
}

/** Exponential backoff retry configuration */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
}

/** Request to capture a new memory */
export interface CaptureRequest {
  text: string;
  agent_id: string;
  content_type?: string;
  metadata?: Record<string, unknown>;
}

/** Response from capture API */
export interface CaptureResponse {
  id: string;
  text: string;
  agent_id: string;
  created_at: string;
}

/** Request to recall memories */
export interface RecallRequest {
  query: string;
  agent_id: string;
  top_k?: number;
}

/** A single recalled memory */
export interface Memory {
  id: string;
  text: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/** Response from recall API */
export interface RecallResponse {
  memories: Memory[];
  query: string;
}

/** Daily stats response */
export interface DailyStats {
  agent_id: string;
  date: string;
  total_memories: number;
  captures: number;
  recalls: number;
}

/** Report metadata */
export interface ReportMeta {
  id: string;
  agent_id: string;
  date: string;
  type: 'daily' | 'weekly';
}

/** Weekly aggregated stats */
export interface WeeklyStats {
  agent_id: string;
  week_start: string;
  week_end: string;
  total_memories: number;
  total_captures: number;
  total_recalls: number;
  daily_count: number;
}

// ─── Task-Aware Recall Types (KR-3.10) ─────────────────────────────

export interface CompileResponse {
  task_summary: string;
  next_steps: string[];
  confidence: number;
}

// ─── TIL Types (KR-3.7) ───────────────────────────────────────────

export type TILPeriod = 'daily' | 'weekly';
export type TILRefreshType = 'correction' | 'expansion' | 'paradigm_shift';

export interface TILEntry {
  id: string;
  agent_id: string;
  date: string;
  period: TILPeriod;
  before_statement: string;
  after_statement: string;
  refresh_type: TILRefreshType;
  source_memory_ids: string[];
  source_summary: string;
  shareability: number;
  impact_score: number;
  topic: string;
  tags?: string[];
  created_at: string;
}

export interface CreateTILEntry {
  agent_id: string;
  date: string;
  period?: TILPeriod;
  before_statement: string;
  after_statement: string;
  refresh_type?: TILRefreshType;
  source_memory_ids?: string[];
  source_summary?: string;
  shareability?: number;
  impact_score?: number;
  topic: string;
  tags?: string[];
}

export interface CreateTILResponse {
  id: string;
}

export interface TILListResponse {
  til_entries: TILEntry[];
  count: number;
}

// ─── Memory Coach Types (KR-3.13) ─────────────────────────────────

export interface CoachIssue {
  type: 'decay' | 'duplicate' | 'fragmentation' | 'staleness' | 'coverage_gap';
  memory_id: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  detected_at: string;
}

export interface CoachHygieneReport {
  agent_id: string;
  generated_at: string;
  hygiene_score: number;
  total_issues: number;
  summary: {
    high: number;
    medium: number;
    low: number;
  };
  issues: CoachIssue[];
}

export interface CoachStats {
  agent_id: string;
  generated_at: string;
  hygiene_score: number;
  issue_counts: {
    high: number;
    medium: number;
    low: number;
  };
  total_issues: number;
}

export interface CoachCheckResponse {
  issues_found: number;
  issues: CoachIssue[];
  checked_at: string;
}

export interface CoachCheckRequest {
  agent_id: string;
  detectors?: string[];
}

// ─── Causal Memory Types (KR-3.14) ─────────────────────────────────

export interface CounterfactualBranch {
  id: string;
  source_memory_id: string;
  branch_id: string;
  alternative_choice: string;
  hypothesis: string;
  confidence: number;
  key_differences: string[];
  created_at: number;
  updated_at: number;
}

export interface CounterfactualExtractResponse {
  branch: CounterfactualBranch;
}

export interface CounterfactualListResponse {
  branches: CounterfactualBranch[];
}

export interface CausalChainResult {
  memory_id: string;
  branches: CounterfactualBranch[];
  summary: string;
  extracted_at: string;
}

export interface CausalDetectResult {
  is_causal: boolean;
  confidence: number;
  reasoning: string;
}
