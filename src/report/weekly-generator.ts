/**
 * Weekly Report Generator
 *
 * Aggregates daily stats into weekly Markdown reports.
 */

import { DailyStats } from '../types';

/** Weekly aggregated stats */
export interface WeeklyStats {
  agent_id: string;
  week_start: string;
  week_end: string;
  total_memories: number;
  total_captures: number;
  total_recalls: number;
  daily_count: number;
  daily_breakdown: DailyStats[];
}

/**
 * Format a single WeeklyStats object into a Markdown section
 */
export function formatWeeklyStats(stats: WeeklyStats): string {
  const lines = [
    `## 📊 Weekly Stats — ${stats.week_start} ~ ${stats.week_end}`,
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Agent | \`${stats.agent_id}\` |`,
    `| Week Start | ${stats.week_start} |`,
    `| Week End | ${stats.week_end} |`,
    `| Total Memories | **${stats.total_memories}** |`,
    `| Total Captures | ${stats.total_captures} |`,
    `| Total Recalls | ${stats.total_recalls} |`,
    `| Days Tracked | ${stats.daily_count} |`,
    '',
  ];
  return lines.join('\n');
}

/**
 * Generate a full weekly report Markdown
 */
export function generateWeeklyReport(weeklyStats: WeeklyStats): string {
  const parts: string[] = [];

  // Header
  parts.push(`# Weekly Report — ${weeklyStats.agent_id}`);
  parts.push(`> Period: ${weeklyStats.week_start} ~ ${weeklyStats.week_end}`);
  parts.push(`> Generated: ${new Date().toISOString()}`);
  parts.push('');

  // Weekly stats
  parts.push(formatWeeklyStats(weeklyStats));
  parts.push('');

  // Daily breakdown
  if (weeklyStats.daily_breakdown.length > 0) {
    parts.push('## Daily Breakdown');
    parts.push('');
    parts.push('| Date | Memories | Captures | Recalls |');
    parts.push('|------|----------|----------|---------|');
    for (const day of weeklyStats.daily_breakdown) {
      parts.push(`| ${day.date} | ${day.total_memories} | ${day.captures} | ${day.recalls} |`);
    }
    parts.push('');
  }

  return parts.join('\n');
}

/**
 * Compute week start/end from a given date
 * Week starts on Monday
 */
export function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0 = Sunday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (dt: Date) => dt.toISOString().split('T')[0];
  return { start: fmt(monday), end: fmt(sunday) };
}

/**
 * Aggregate daily stats into weekly stats
 */
export function aggregateWeeklyStats(
  dailyStatsList: DailyStats[],
  agentId: string,
): WeeklyStats {
  const weekDates = new Set<string>();
  let totalMemories = 0;
  let totalCaptures = 0;
  let totalRecalls = 0;

  for (const day of dailyStatsList) {
    weekDates.add(day.date);
    totalMemories += day.total_memories;
    totalCaptures += day.captures;
    totalRecalls += day.recalls;
  }

  const { start, end } = getWeekRange(new Date());

  return {
    agent_id: agentId,
    week_start: start,
    week_end: end,
    total_memories: totalMemories,
    total_captures: totalCaptures,
    total_recalls: totalRecalls,
    daily_count: weekDates.size,
    daily_breakdown: dailyStatsList,
  };
}
