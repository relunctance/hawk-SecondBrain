/**
 * AlmostLost TypeScript type definitions — KR-3.8
 * API endpoints: /v1/almost-lost/*
 */

export type EmotionalWeight = 'low' | 'medium' | 'high';
export type UserDecision = 'pending' | 'keep' | 'delete' | 'update';

export interface AlmostLostWarning {
  id: string;
  memory_id: string;
  agent_id: string;
  memory_content: string;
  created_at: string;
  decay_at: string;
  warning_at: string;
  importance_score: number; // 0.0–1.0
  last_accessed_at: string;
  access_count: number;
  emotional_weight: EmotionalWeight;
  user_decision: UserDecision;
  decided_at: string;
}

export interface AlmostLostDetectResponse {
  agent_id: string;
  count: number;
  warnings: AlmostLostWarning[];
}

export interface AlmostLostStatsResponse {
  pending: number;
  total: number;
}

export interface DecideAlmostLostRequest {
  decision: UserDecision;
  updated_content?: string;
  updated_context?: string;
}
