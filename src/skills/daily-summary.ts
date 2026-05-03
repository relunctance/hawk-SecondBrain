/**
 * Daily Summary skill
 * 
 * Formats hawk-memory daily stats into human-readable Markdown.
 */

import { DailyStats, Memory } from '../types';

/**
 * Format a single DailyStats object into a Markdown line
 */
export function formatDailyStats(stats: DailyStats): string {
  const lines = [
    `## 📊 Daily Stats — ${stats.date}`,
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Agent | \`${stats.agent_id}\` |`,
    `| Total Memories | **${stats.total_memories}** |`,
    `| Captures | ${stats.captures} |`,
    `| Recalls | ${stats.recalls} |`,
    '',
  ];
  return lines.join('\n');
}

/**
 * Generate a full daily summary Markdown report
 */
export function generateDailySummary(
  stats: DailyStats,
  recentMemories: Memory[],
): string {
  const parts: string[] = [];

  // Header
  parts.push(`# Daily Summary — ${stats.agent_id}`);
  parts.push(`> Generated: ${new Date().toISOString()}`);
  parts.push('');

  // Stats block
  parts.push(formatDailyStats(stats));
  parts.push('');

  // Recent memories
  if (recentMemories.length > 0) {
    parts.push('## 🧠 Recent Memories');
    parts.push('');
    for (const mem of recentMemories) {
      const scoreLabel = (mem.score * 100).toFixed(0);
      parts.push(`- [${scoreLabel}%] ${mem.text}`);
    }
    parts.push('');
  } else {
    parts.push('## 🧠 Recent Memories');
    parts.push('');
    parts.push('_No recent memories_');
    parts.push('');
  }

  return parts.join('\n');
}
