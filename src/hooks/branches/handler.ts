/**
 * Branching Hook Handler
 *
 * Memory Branching API bridge:
 * - createBranch() → POST /v1/branches
 * - listBranches() → GET /v1/branches/:agent_id
 * - getBranch() → GET /v1/branches/:agent_id/:branch_id
 * - deleteBranch() → DELETE /v1/branches/:agent_id/:branch_id
 * - mergeBranch() → POST /v1/branches/:agent_id/:branch_id/merge
 */

import { HawkMemoryClient } from '../../client';

export interface BranchingHandlerDeps {
  client: HawkMemoryClient;
  logger: {
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
  };
}

export type BranchType = 'what_if' | 'alternative_decision' | 'exploration';

export interface CreateBranchParams {
  agentId: string;
  branchName: string;
  branchType: BranchType;
  description?: string;
  sourceDecision?: string;
}

export interface Branch {
  id: string;
  agent_id: string;
  name: string;
  branch_type: string;
  description?: string;
  parent_branch_id?: string;
  source_memory_id?: string;
  source_decision?: string;
  created_at: string;
  updated_at?: string;
}

export interface BranchWithMemories extends Branch {
  branch_memories: Array<{
    id: string;
    text: string;
    score?: number;
  }>;
}

export interface MergeResult {
  branch_id: string;
  merged_into: string;
  status: string;
}

export interface DeleteResult {
  branch_id: string;
  status: string;
}

export class BranchingHandler {
  constructor(private deps: BranchingHandlerDeps) {}

  /**
   * Create a new memory branch
   * POST /v1/branches
   */
  async createBranch(params: CreateBranchParams): Promise<Branch> {
    const { client, logger } = this.deps;
    logger.info('branching_create_start', { agentId: params.agentId, branchName: params.branchName });

    const branch = await client.createBranch({
      agentId: params.agentId,
      branchName: params.branchName,
      branchType: params.branchType,
      description: params.description,
      sourceDecision: params.sourceDecision,
    });

    logger.info('branching_create_done', { branchId: branch.id });
    return branch;
  }

  /**
   * List all branches for an agent
   * GET /v1/branches/:agent_id
   */
  async listBranches(agentId: string): Promise<Branch[]> {
    const { client, logger } = this.deps;
    logger.info('branching_list_start', { agentId });

    const branches = await client.listBranches(agentId);

    logger.info('branching_list_done', { agentId, count: branches.length });
    return branches;
  }

  /**
   * Get a branch with its memories
   * GET /v1/branches/:agent_id/:branch_id
   */
  async getBranch(branchId: string): Promise<BranchWithMemories> {
    const { client, logger } = this.deps;
    logger.info('branching_get_start', { branchId });

    const branch = await client.getBranch(branchId);

    logger.info('branching_get_done', { branchId });
    return branch;
  }

  /**
   * Delete (discard) a branch
   * DELETE /v1/branches/:agent_id/:branch_id
   */
  async deleteBranch(branchId: string): Promise<DeleteResult> {
    const { client, logger } = this.deps;
    logger.info('branching_delete_start', { branchId });

    const result = await client.deleteBranch(branchId);

    logger.info('branching_delete_done', { branchId });
    return result;
  }

  /**
   * Merge a branch back into target
   * POST /v1/branches/:agent_id/:branch_id/merge
   */
  async mergeBranch(branchId: string, mergedInto: string): Promise<MergeResult> {
    const { client, logger } = this.deps;
    logger.info('branching_merge_start', { branchId, mergedInto });

    const result = await client.mergeBranch(branchId, mergedInto);

    logger.info('branching_merge_done', { branchId, mergedInto });
    return result;
  }
}
