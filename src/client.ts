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

  private async requestWithRetry<T>(
    url: string,
    method: 'get' | 'post',
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
