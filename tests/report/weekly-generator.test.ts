/**
 * Weekly Report Generator Tests
 *
 * Tests generateWeeklyReport() and formatWeeklyStats()
 */

import { generateWeeklyReport, formatWeeklyStats, WeeklyStats } from '../../src/report/weekly-generator';
import { DailyStats } from '../../src/types';

describe('formatWeeklyStats', () => {
  it('should format weekly stats with totals', () => {
    const stats: WeeklyStats = {
      agent_id: 'test-agent',
      week_start: '2026-04-28',
      week_end: '2026-05-04',
      total_memories: 300,
      total_captures: 70,
      total_recalls: 230,
      daily_count: 7,
      daily_breakdown: [],
    };
    const result = formatWeeklyStats(stats);
    expect(result).toContain('test-agent');
    expect(result).toContain('2026-04-28');
    expect(result).toContain('2026-05-04');
    expect(result).toContain('300');
    expect(result).toContain('70');
    expect(result).toContain('230');
  });

  it('should handle zero values', () => {
    const stats: WeeklyStats = {
      agent_id: 'empty-agent',
      week_start: '2026-04-28',
      week_end: '2026-05-04',
      total_memories: 0,
      total_captures: 0,
      total_recalls: 0,
      daily_count: 0,
      daily_breakdown: [],
    };
    const result = formatWeeklyStats(stats);
    expect(result).toContain('0');
  });
});

describe('generateWeeklyReport', () => {
  it('should generate report with header and stats', () => {
    const weeklyStats: WeeklyStats = {
      agent_id: 'test-agent',
      week_start: '2026-04-28',
      week_end: '2026-05-04',
      total_memories: 300,
      total_captures: 70,
      total_recalls: 230,
      daily_count: 7,
      daily_breakdown: [],
    };
    const result = generateWeeklyReport(weeklyStats);
    expect(result).toContain('# Weekly Report');
    expect(result).toContain('test-agent');
    expect(result).toContain('2026-04-28');
    expect(result).toContain('2026-05-04');
    expect(result).toContain('300');
  });

  it('should include daily breakdown when provided', () => {
    const dailyBreakdown: DailyStats[] = [
      { agent_id: 'test', date: '2026-04-28', total_memories: 40, captures: 10, recalls: 30 },
      { agent_id: 'test', date: '2026-04-29', total_memories: 50, captures: 12, recalls: 38 },
    ];
    const weeklyStats: WeeklyStats = {
      agent_id: 'test-agent',
      week_start: '2026-04-28',
      week_end: '2026-05-04',
      total_memories: 90,
      total_captures: 22,
      total_recalls: 68,
      daily_count: 2,
      daily_breakdown: dailyBreakdown,
    };
    const result = generateWeeklyReport(weeklyStats);
    expect(result).toContain('2026-04-28');
    expect(result).toContain('2026-04-29');
    expect(result).toContain('## Daily Breakdown');
  });

  it('should handle empty breakdown', () => {
    const weeklyStats: WeeklyStats = {
      agent_id: 'new-agent',
      week_start: '2026-04-28',
      week_end: '2026-05-04',
      total_memories: 0,
      total_captures: 0,
      total_recalls: 0,
      daily_count: 0,
      daily_breakdown: [],
    };
    const result = generateWeeklyReport(weeklyStats);
    expect(result).toContain('# Weekly Report');
  });
});
