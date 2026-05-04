/**
 * Causal Memory Types (KR-3.14)
 * Causal/counterfactual reasoning for decision analysis
 */

// ─── Counterfactual Types ───────────────────────────────────────────

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

// ─── Causal Chain Types ────────────────────────────────────────────

export interface CausalChainResult {
  memory_id: string;
  branches: CounterfactualBranch[];
  summary: string;
  extracted_at: string;
}

export interface CausalExtractRequest {
  agent_id: string;
  memory_id: string;
  topic?: string;
}

export interface CausalExtractResponse {
  memory_id: string;
  branches: CounterfactualBranch[];
  summary: string;
  extracted_at: string;
}

// ─── Causal Detection Types ────────────────────────────────────────

export interface CausalDetectRequest {
  agent_id: string;
  cause: string;
  effect: string;
}

export interface CausalDetectResult {
  is_causal: boolean;
  confidence: number;
  reasoning: string;
}

// ─── Causal Memory Event ───────────────────────────────────────────

export interface CausalMemoryEvent {
  event_id: string;
  branches: CounterfactualBranch[];
}
