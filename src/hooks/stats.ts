/**
 * Stats Hook Handler
 *
 * Fetches daily stats from hawk-memory and generates summaries.
 */

import { HawkMemoryClient } from '../client';
import { formatDailyStats, generateDailySummary } from '../skills/daily-summary';
import { Memory } from '../types';

export interface StatsHandlerDeps {
  client: HawkMemoryClient;
}

export class StatsHandler {
  private client: HawkMemoryClient;

  constructor(deps: StatsHandlerDeps) {
    this.client = deps.client;
  }

  /**
   * Get formatted daily stats for today
   */
  async getDailyStats(): Promise<string> {
    try {
      const stats = await this.client.statsDaily();
      return formatDailyStats(stats);
    } catch (err) {
      return `## 📊 Daily Stats\n\n> Error fetching stats: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  /**
   * Get full daily summary with recent memories
   */
  async getTodaySummary(): Promise<string> {
    try {
      const stats = await this.client.statsDaily();

      // Get recent high-score memories for context
      let recentMemories: Memory[] = [];
      try {
        const recallResp = await this.client.recall({
          query: '',
          top_k: 5,
        });
        recentMemories = recallResp.memories.filter(m => m.score > 0.8);
      } catch {
        // Non-critical: recall failure should not block stats
      }

      return generateDailySummary(stats, recentMemories);
    } catch (err) {
      return `# Daily Summary\n\n> Error generating summary: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
}
