/**
 * TIL Hook Handler - KR-3.7 Integration
 *
 * Handles TIL (Today I Learned) operations: create, get, list, delete.
 */

import {
  TILEntry,
  CreateTILResponse,
  TILListResponse,
} from './types';

export interface TILHookDeps {
  createTIL: (entry: {
    agent_id: string;
    date: string;
    period?: string;
    before_statement: string;
    after_statement: string;
    refresh_type?: string;
    source_memory_ids?: string[];
    source_summary?: string;
    shareability?: number;
    impact_score?: number;
    topic: string;
    tags?: string[];
  }) => Promise<CreateTILResponse>;
  getTIL: (id: string) => Promise<TILEntry>;
  listTILByAgent: (limit?: number) => Promise<TILListResponse>;
  listTILByDate: (date: string, limit?: number) => Promise<TILListResponse>;
  deleteTIL: (id: string) => Promise<void>;
}

export class TILHook {
  private deps: TILHookDeps;

  constructor(deps: TILHookDeps) {
    this.deps = deps;
  }

  /**
   * Create a new TIL entry
   * POST /v1/til
   */
  async create(entry: {
    agent_id: string;
    date: string;
    period?: string;
    before_statement: string;
    after_statement: string;
    refresh_type?: string;
    source_memory_ids?: string[];
    source_summary?: string;
    shareability?: number;
    impact_score?: number;
    topic: string;
    tags?: string[];
  }): Promise<CreateTILResponse> {
    return this.deps.createTIL(entry);
  }

  /**
   * Get a TIL entry by ID
   * GET /v1/til/:id
   */
  async get(id: string): Promise<TILEntry> {
    if (!id || id.trim().length === 0) {
      throw new Error('TIL ID is required');
    }
    return this.deps.getTIL(id);
  }

  /**
   * List TIL entries by agent
   * GET /v1/til/agent/:agent_id
   */
  async listByAgent(limit: number = 20): Promise<TILListResponse> {
    if (limit <= 0) {
      throw new Error('Limit must be positive');
    }
    return this.deps.listTILByAgent(limit);
  }

  /**
   * List TIL entries by agent and date
   * GET /v1/til/date/:agent_id/:date
   */
  async listByDate(date: string, limit: number = 20): Promise<TILListResponse> {
    if (!date || date.trim().length === 0) {
      throw new Error('Date is required');
    }
    if (limit <= 0) {
      throw new Error('Limit must be positive');
    }
    return this.deps.listTILByDate(date, limit);
  }

  /**
   * Delete a TIL entry
   * DELETE /v1/til/:id
   */
  async delete(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('TIL ID is required');
    }
    return this.deps.deleteTIL(id);
  }
}
