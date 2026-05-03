/**
 * Recall Hook Handler
 *
 * Handles memory recall by delegating to HawkMemoryClient.
 * Copy strategy: 改造 - 去掉 HybridRetriever → client.recall()
 */

import { RecallResponse } from '../../types';

export interface RecallHandlerDeps {
  recall: (query: string, top_k?: number) => Promise<RecallResponse>;
}

export class RecallHandler {
  private recallFn: RecallHandlerDeps['recall'];

  constructor(deps: RecallHandlerDeps) {
    this.recallFn = deps.recall;
  }

  /**
   * Handle a recall request
   * @param query The search query
   * @param top_k Number of memories to return (default 5)
   * @returns The recall response with matched memories
   * @throws Error if query is empty
   */
  async handle(query: string, top_k: number = 5): Promise<RecallResponse> {
    if (!query || query.trim().length === 0) {
      throw new Error('Query is required');
    }
    return this.recallFn(query.trim(), top_k);
  }
}
