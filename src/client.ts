/**
 * HawkMemoryClient - HTTP API client for hawk-memory
 *
 * Implements capture/recall/statsDaily/listReports with:
 * - Exponential backoff retry (0.5s/1s/2s)
 * - AbortController 5s timeout
 * - Silent degradation on non-critical errors
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ClientConfig,
  RetryConfig,
  CaptureRequest,
  CaptureResponse,
  RecallRequest,
  RecallResponse,
  DailyStats,
  ReportMeta,
  TILEntry,
  CreateTILEntry,
  CreateTILResponse,
  TILListResponse,
} from './types';
import { loadConfig } from './config';

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_RETRY: RetryConfig = { maxAttempts: 3, baseDelayMs: 500 };

export class HawkMemoryClient {
  private client: AxiosInstance;
  private agentId: string;

  constructor(config?: Partial<ClientConfig>) {
    const cfg = loadConfig();
    const baseUrl = config?.baseUrl || cfg.hawkMemoryUrl;
    this.agentId = config?.agentId || cfg.hawkAgentId;

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: config?.timeoutMs || DEFAULT_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.hawkApiKey ? { 'Authorization': `Bearer ${cfg.hawkApiKey}` } : {}),
      },
    });
  }

  /** Capture a memory via POST /v1/capture */
  async capture(req: Omit<CaptureRequest, 'agent_id'>): Promise<CaptureResponse> {
    const payload = { ...req, agent_id: this.agentId };
    return this.requestWithRetry<CaptureResponse>('/v1/capture', 'post', payload);
  }

  /** Recall memories via POST /v1/recall */
  async recall(req: Omit<RecallRequest, 'agent_id'>): Promise<RecallResponse> {
    const payload = { ...req, agent_id: this.agentId };
    return this.requestWithRetry<RecallResponse>('/v1/recall', 'post', payload);
  }

  /** Get daily stats via GET /v1/stats/daily */
  async statsDaily(): Promise<DailyStats> {
    return this.requestWithRetry<DailyStats>('/v1/stats/daily', 'get', null, {
      params: { agent_id: this.agentId },
    });
  }

  /** List reports via GET /v1/reports */
  async listReports(): Promise<ReportMeta[]> {
    return this.requestWithRetry<ReportMeta[]>('/v1/reports', 'get', null, {
      params: { agent_id: this.agentId },
    });
  }

  /** Create a TIL entry via POST /v1/til */
  async createTIL(entry: CreateTILEntry): Promise<CreateTILResponse> {
    return this.requestWithRetry<CreateTILResponse>('/v1/til', 'post', entry);
  }

  /** Get a TIL entry by ID via GET /v1/til/:id */
  async getTIL(id: string): Promise<TILEntry> {
    return this.requestWithRetry<TILEntry>(`/v1/til/${id}`, 'get', null);
  }

  /** List TIL entries by agent via GET /v1/til/agent/:agent_id */
  async listTILByAgent(limit: number = 20): Promise<TILListResponse> {
    return this.requestWithRetry<TILListResponse>('/v1/til/agent/' + this.agentId, 'get', null, {
      params: { limit },
    });
  }

  /** List TIL entries by agent and date via GET /v1/til/date/:agent_id/:date */
  async listTILByDate(date: string, limit: number = 20): Promise<TILListResponse> {
    return this.requestWithRetry<TILListResponse>(`/v1/til/date/${this.agentId}/${date}`, 'get', null, {
      params: { limit },
    });
  }

  /** Delete a TIL entry via DELETE /v1/til/:id */
  async deleteTIL(id: string): Promise<void> {
    return this.requestWithRetry<void>(`/v1/til/${id}`, 'delete', null);
  }

  // ─── Branching API ───────────────────────────────────────────────────

  /** Create a branch via POST /v1/branches */
  async createBranch(params: {
    agentId: string;
    branchName: string;
    branchType: string;
    description?: string;
    sourceDecision?: string;
  }): Promise<any> {
    const body = {
      agent_id: params.agentId,
      branch_name: params.branchName,
      branch_type: params.branchType,
      description: params.description,
      source_decision: params.sourceDecision,
    };
    const resp = await this.requestWithRetry<{ branch: any }>('/v1/branches', 'post', body);
    return resp.branch;
  }

  /** List branches for an agent via GET /v1/branches/:agent_id */
  async listBranches(agentId: string): Promise<any[]> {
    const resp = await this.requestWithRetry<{ branches: any[] }>(`/v1/branches/${agentId}`, 'get', null);
    return resp.branches || [];
  }

  /** Get a branch with memories via GET /v1/branches/:agent_id/:branch_id */
  async getBranch(branchId: string): Promise<any> {
    // Note: the path uses agent_id prefix but branch_id is what we need
    const resp = await this.requestWithRetry<{ branch: any }>(`/v1/branches/__agent__/${branchId}`, 'get', null);
    return resp.branch;
  }

  /** Delete a branch via DELETE /v1/branches/:agent_id/:branch_id */
  async deleteBranch(branchId: string): Promise<{ branch_id: string; status: string }> {
    return this.requestWithRetry<{ branch_id: string; status: string }>(
      `/v1/branches/__agent__/${branchId}`, 'delete', null
    );
  }

  /** Merge a branch via POST /v1/branches/:agent_id/:branch_id/merge */
  async mergeBranch(branchId: string, mergedInto: string): Promise<{ branch_id: string; merged_into: string; status: string }> {
    const body = { merged_into: mergedInto };
    return this.requestWithRetry<{ branch_id: string; merged_into: string; status: string }>(
      `/v1/branches/__agent__/${branchId}/merge`, 'post', body
    );
  }

  private async requestWithRetry<T>(
    url: string,
    method: 'get' | 'post' | 'delete',
    data: unknown,
    config: Record<string, unknown> = {},
    retryConfig: RetryConfig = DEFAULT_RETRY,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        const response = await this.client.request<T>({ url, method, data, ...config });
        return response.data;
      } catch (err) {
        lastError = err as Error;
        const axiosErr = err as AxiosError;
        // Non-retryable: 4xx client errors (except 429)
        if (axiosErr.response?.status && axiosErr.response.status >= 400 && axiosErr.response.status < 500 && axiosErr.response.status !== 429) {
          throw err;
        }
        if (attempt < retryConfig.maxAttempts) {
          const delay = retryConfig.baseDelayMs * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    // Silent degradation: return empty result for stats/reports
    if (url === '/v1/stats/daily') return { agent_id: this.agentId, date: new Date().toISOString().split('T')[0], total_memories: 0, captures: 0, recalls: 0 } as T;
    if (url === '/v1/reports') return [] as unknown as T;
    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
