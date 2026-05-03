/**
 * Dream Hook Handler
 *
 * Handles dream/memory consolidation by:
 * - Generating insights via LLM (when available)
 * - Capturing consolidated memories via HawkMemoryClient
 *
 * Copy strategy: 改造 - 保留 LLM 逻辑,DB → client.capture()
 */

import { CaptureResponse, Memory } from '../../types';

export interface DreamHandlerDeps {
  capture: (text: string, metadata?: Record<string, unknown>) => Promise<CaptureResponse>;
  generateInsights?: (context: string) => Promise<string[]>;
}

export interface DreamResult {
  insights: string[];
  consolidated: CaptureResponse;
}

export class DreamHandler {
  private captureFn: DreamHandlerDeps['capture'];
  private generateInsightsFn?: DreamHandlerDeps['generateInsights'];

  constructor(deps: DreamHandlerDeps) {
    this.captureFn = deps.capture;
    this.generateInsightsFn = deps.generateInsights;
  }

  /**
   * Handle a dream/consolidation request
   * @param context The context for dream processing (recent memories, etc.)
   * @returns Dream result with insights and consolidated memory
   * @throws Error if context is empty
   */
  async handle(context: string): Promise<DreamResult> {
    if (!context || context.trim().length === 0) {
      throw new Error('Context is required');
    }

    let insights: string[] = [];
    if (this.generateInsightsFn) {
      try {
        insights = await this.generateInsightsFn(context);
      } catch {
        // Graceful degradation: continue without insights
        insights = [];
      }
    }

    // Capture consolidated memory
    const consolidated = await this.captureFn(
      `[Dream Consolidation] ${context}`,
      { type: 'dream', insights_count: insights.length }
    );

    return { insights, consolidated };
  }
}
