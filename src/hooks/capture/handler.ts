/**
 * Capture Hook Handler
 *
 * Handles memory capture by delegating to HawkMemoryClient.
 * Copy strategy:改造 - 去掉 local embed/store → client.capture()
 */

import { HawkMemoryClient } from '../../client';
import { CaptureResponse } from '../../types';

export interface CaptureHandlerDeps {
  capture: (text: string, metadata?: Record<string, unknown>) => Promise<CaptureResponse>;
}

export class CaptureHandler {
  private captureFn: CaptureHandlerDeps['capture'];

  constructor(deps: CaptureHandlerDeps) {
    this.captureFn = deps.capture;
  }

  /**
   * Handle a capture request
   * @param text The memory text to capture
   * @param metadata Optional metadata
   * @returns The captured memory response
   * @throws Error if text is empty
   */
  async handle(text: string, metadata?: Record<string, unknown>): Promise<CaptureResponse> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required');
    }
    return this.captureFn(text.trim(), metadata);
  }
}
