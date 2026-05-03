/**
 * Daily Summary skill tests
 * 
 * Tests formatDailyStats() and generateDailySummary()
 */

import { formatDailyStats, generateDailySummary } from '../../src/skills/daily-summary';
import { DailyStats } from '../../src/types';

describe('formatDailyStats', () => {
  it('should format stats with all fields', () => {
    const stats: DailyStats = {
      agent_id: 'test-agent',
      date: '2026-05-04',
      total_memories: 42,
      captures: 10,
      recalls: 32,
    };
    const result = formatDailyStats(stats);
    expect(result).toContain('test-agent');
    expect(result).toContain('2026-05-04');
    expect(result).toContain('42');
    expect(result).toContain('10');
    expect(result).toContain('32');
  });

  it('should handle zero values', () => {
    const stats: DailyStats = {
      agent_id: 'empty-agent',
      date: '2026-05-04',
      total_memories: 0,
      captures: 0,
      recalls: 0,
    };
    const result = formatDailyStats(stats);
    expect(result).toContain('0');
  });
});

describe('generateDailySummary', () => {
  it('should generate summary with stats and memories', () => {
    const stats: DailyStats = {
      agent_id: 'test-agent',
      date: '2026-05-04',
      total_memories: 100,
      captures: 25,
      recalls: 75,
    };
    const recentMemories = [
      { id: '1', text: 'Learned TypeScript', score: 0.95, metadata: {} },
      { id: '2', text: 'Fixed a bug', score: 0.88, metadata: {} },
    ];
    const result = generateDailySummary(stats, recentMemories);
    expect(result).toContain('# Daily Summary');
    expect(result).toContain('test-agent');
    expect(result).toContain('2026-05-04');
    expect(result).toContain('TypeScript');
    expect(result).toContain('100');
  });

  it('should handle empty memories array', () => {
    const stats: DailyStats = {
      agent_id: 'new-agent',
      date: '2026-05-04',
      total_memories: 0,
      captures: 0,
      recalls: 0,
    };
    const result = generateDailySummary(stats, []);
    expect(result).toContain('No recent memories');
  });
});
