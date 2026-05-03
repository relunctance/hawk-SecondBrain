/**
 * AlmostLost Hook Handler - KR-3.8 Integration
 *
 * Handles AlmostLost (濒临遗忘记忆) operations:
 * - Detect at-risk memories before they decay
 * - List pending warnings
 * - Get specific warning details
 * - User decisions (keep/delete/update)
 * - Statistics
 */

import {
  AlmostLostWarning,
  AlmostLostDetectResponse,
  AlmostLostStatsResponse,
  DecideAlmostLostRequest,
} from './types';

export interface AlmostLostHookDeps {
  detect: (agentId: string) => Promise<AlmostLostDetectResponse>;
  listWarnings: (agentId: string) => Promise<AlmostLostWarning[]>;
  getWarning: (warningId: string) => Promise<AlmostLostWarning>;
  decide: (warningId: string, decision: string, updatedContent?: string, updatedContext?: string) => Promise<void>;
  stats: (agentId: string) => Promise<AlmostLostStatsResponse>;
}

export class AlmostLostHook {
  private deps: AlmostLostHookDeps;

  constructor(deps: AlmostLostHookDeps) {
    this.deps = deps;
  }

  /**
   * Detect at-risk memories that are about to decay
   * POST /v1/almost-lost/detect/:agent_id
   */
  async detect(agentId: string): Promise<AlmostLostDetectResponse> {
    if (!agentId || agentId.trim().length === 0) {
      throw new Error('Agent ID is required');
    }
    return this.deps.detect(agentId.trim());
  }

  /**
   * List all pending warnings for an agent
   * GET /v1/almost-lost/warnings/:agent_id
   */
  async listWarnings(agentId: string): Promise<AlmostLostWarning[]> {
    if (!agentId || agentId.trim().length === 0) {
      throw new Error('Agent ID is required');
    }
    return this.deps.listWarnings(agentId.trim());
  }

  /**
   * Get a specific warning by ID
   * GET /v1/almost-lost/warning/:id
   */
  async getWarning(warningId: string): Promise<AlmostLostWarning> {
    if (!warningId || warningId.trim().length === 0) {
      throw new Error('Warning ID is required');
    }
    return this.deps.getWarning(warningId.trim());
  }

  /**
   * Record user's decision on a warning
   * POST /v1/almost-lost/warning/:id/decide
   */
  async decide(
    warningId: string,
    decision: string,
    updatedContent?: string,
    updatedContext?: string
  ): Promise<void> {
    if (!warningId || warningId.trim().length === 0) {
      throw new Error('Warning ID is required');
    }
    if (!decision || decision.trim().length === 0) {
      throw new Error('Decision is required');
    }
    const validDecisions = ['keep', 'delete', 'update'];
    if (!validDecisions.includes(decision.trim())) {
      throw new Error(`Invalid decision: ${decision}. Must be one of: ${validDecisions.join(', ')}`);
    }

    const req: DecideAlmostLostRequest = {
      decision: decision.trim() as 'keep' | 'delete' | 'update',
      updated_content: updatedContent,
      updated_context: updatedContext,
    };

    return this.deps.decide(warningId.trim(), req.decision, req.updated_content, req.updated_context);
  }

  /**
   * Get AlmostLost statistics for an agent
   * GET /v1/almost-lost/stats/:agent_id
   */
  async stats(agentId: string): Promise<AlmostLostStatsResponse> {
    if (!agentId || agentId.trim().length === 0) {
      throw new Error('Agent ID is required');
    }
    return this.deps.stats(agentId.trim());
  }

  /**
   * Get count of pending (undecided) warnings for an agent
   */
  async pendingCount(agentId: string): Promise<number> {
    const warnings = await this.listWarnings(agentId);
    return warnings.filter(w => w.user_decision === 'pending').length;
  }
}
