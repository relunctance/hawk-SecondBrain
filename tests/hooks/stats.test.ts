/**
 * Stats Hook Handler tests
 */

import { StatsHandler } from '../../src/hooks/stats';
import { HawkMemoryClient } from '../../src/client';
import { DailyStats } from '../../src/types';

// Mock the client
jest.mock('../../src/client', () => ({
  HawkMemoryClient: jest.fn().mockImplementation(() => ({
    statsDaily: jest.fn(),
    recall: jest.fn(),
  })),
}));

describe('StatsHandler', () => {
  let mockClient: jest.Mocked<HawkMemoryClient>;
  let statsHandler: StatsHandler;

  beforeEach(() => {
    mockClient = new HawkMemoryClient({ baseUrl: 'http://localhost:18368', agentId: 'test' }) as jest.Mocked<HawkMemoryClient>;
    statsHandler = new StatsHandler({ client: mockClient });
  });

  describe('getDailyStats', () => {
    it('should return formatted stats for today', async () => {
      const mockStats: DailyStats = {
        agent_id: 'test-agent',
        date: '2026-05-04',
        total_memories: 42,
        captures: 10,
        recalls: 32,
      };
      (mockClient.statsDaily as jest.Mock).mockResolvedValue(mockStats);

      const result = await statsHandler.getDailyStats();

      expect(result).toContain('test-agent');
      expect(result).toContain('42');
      expect(result).toContain('10');
      expect(result).toContain('32');
      expect(mockClient.statsDaily).toHaveBeenCalled();
    });

    it('should handle client errors gracefully', async () => {
      (mockClient.statsDaily as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await statsHandler.getDailyStats();

      expect(result).toContain('Error');
    });
  });

  describe('getTodaySummary', () => {
    it('should return full summary with recent memories', async () => {
      const mockStats: DailyStats = {
        agent_id: 'test-agent',
        date: '2026-05-04',
        total_memories: 100,
        captures: 25,
        recalls: 75,
      };
      const mockMemories = [
        { id: '1', text: 'Learned TypeScript', score: 0.95, metadata: {} },
      ];
      (mockClient.statsDaily as jest.Mock).mockResolvedValue(mockStats);
      (mockClient.recall as jest.Mock).mockResolvedValue({ memories: mockMemories, query: '' });

      const result = await statsHandler.getTodaySummary();

      expect(result).toContain('# Daily Summary');
      expect(result).toContain('TypeScript');
    });
  });
});
