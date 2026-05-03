/**
 * TIL TypeScript type definitions — KR-3.7
 */

export type TILPeriod = 'daily' | 'weekly';
export type TILRefreshType = 'correction' | 'expansion' | 'paradigm_shift';

export interface TILEntry {
  id: string;
  agent_id: string;
  date: string; // "2026-04-28"
  period: TILPeriod;
  before_statement: string; // 「之前以为...」
  after_statement: string;  // 「现在知道...」
  refresh_type: TILRefreshType;
  source_memory_ids: string[];
  source_summary: string;
  shareability: number; // 0.0–1.0
  impact_score: number; // 0.0–1.0
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
