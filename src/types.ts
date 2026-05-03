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
