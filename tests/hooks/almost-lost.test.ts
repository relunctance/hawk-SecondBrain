/**
 * AlmostLost Hook Handler Tests - KR-3.8
 * TDD RED phase: tests first, then implementation
 */

import { AlmostLostHook, AlmostLostHookDeps } from '../../src/hooks/almost-lost/handler';
import type { AlmostLostWarning, AlmostLostDetectResponse } from '../../src/hooks/almost-lost/types';

// Mock deps
const mockDeps: AlmostLostHookDeps = {
  detect: jest.fn(),
  listWarnings: jest.fn(),
  getWarning: jest.fn(),
  decide: jest.fn(),
  stats: jest.fn(),
};

describe('AlmostLostHook - KR-3.8 Integration', () => {
  let hook: AlmostLostHook;

  beforeEach(() => {
    jest.clearAllMocks();
    hook = new AlmostLostHook(mockDeps);
  });

  describe('detect', () => {
    it('should call deps.detect with agent_id', async () => {
      const mockResponse: AlmostLostDetectResponse = {
        agent_id: 'test-agent',
        count: 2,
        warnings: [
          {
            id: 'al-001',
            memory_id: 'mem-001',
            agent_id: 'test-agent',
            memory_content: 'Test memory 1',
            created_at: '2026-05-01T10:00:00Z',
            decay_at: '2026-05-08T10:00:00Z',
            warning_at: '2026-05-04T10:00:00Z',
            importance_score: 0.5,
            last_accessed_at: '2026-05-01T10:00:00Z',
            access_count: 1,
            emotional_weight: 'medium',
            user_decision: 'pending',
            decided_at: '0001-01-01T00:00:00Z',
          },
        ],
      };

      (mockDeps.detect as jest.Mock).mockResolvedValue(mockResponse);

      const result = await hook.detect('test-agent');

      expect(mockDeps.detect).toHaveBeenCalledWith('test-agent');
      expect(result).toEqual(mockResponse);
      expect(result.count).toBe(2);
      expect(result.warnings).toHaveLength(1);
    });

    it('should handle empty warnings array', async () => {
      const mockResponse: AlmostLostDetectResponse = {
        agent_id: 'empty-agent',
        count: 0,
        warnings: [],
      };

      (mockDeps.detect as jest.Mock).mockResolvedValue(mockResponse);

      const result = await hook.detect('empty-agent');

      expect(result.count).toBe(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should propagate errors from detect', async () => {
      (mockDeps.detect as jest.Mock).mockRejectedValue(new Error('network error'));

      await expect(hook.detect('test-agent')).rejects.toThrow('network error');
    });
  });

  describe('listWarnings', () => {
    it('should call deps.listWarnings with agent_id', async () => {
      const mockWarnings: AlmostLostWarning[] = [
        {
          id: 'al-001',
          memory_id: 'mem-001',
          agent_id: 'test-agent',
          memory_content: 'Memory 1',
          created_at: '2026-05-01T10:00:00Z',
          decay_at: '2026-05-08T10:00:00Z',
          warning_at: '2026-05-04T10:00:00Z',
          importance_score: 0.3,
          last_accessed_at: '2026-05-01T10:00:00Z',
          access_count: 0,
          emotional_weight: 'low',
          user_decision: 'pending',
          decided_at: '0001-01-01T00:00:00Z',
        },
      ];

      (mockDeps.listWarnings as jest.Mock).mockResolvedValue(mockWarnings);

      const result = await hook.listWarnings('test-agent');

      expect(mockDeps.listWarnings).toHaveBeenCalledWith('test-agent');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('al-001');
    });

    it('should return empty array when no warnings', async () => {
      (mockDeps.listWarnings as jest.Mock).mockResolvedValue([]);

      const result = await hook.listWarnings('no-warnings-agent');

      expect(result).toHaveLength(0);
    });
  });

  describe('getWarning', () => {
    it('should call deps.getWarning with warning id', async () => {
      const mockWarning: AlmostLostWarning = {
        id: 'al-001',
        memory_id: 'mem-001',
        agent_id: 'test-agent',
        memory_content: 'Test memory',
        created_at: '2026-05-01T10:00:00Z',
        decay_at: '2026-05-08T10:00:00Z',
        warning_at: '2026-05-04T10:00:00Z',
        importance_score: 0.5,
        last_accessed_at: '2026-05-01T10:00:00Z',
        access_count: 2,
        emotional_weight: 'medium',
        user_decision: 'pending',
        decided_at: '0001-01-01T00:00:00Z',
      };

      (mockDeps.getWarning as jest.Mock).mockResolvedValue(mockWarning);

      const result = await hook.getWarning('al-001');

      expect(mockDeps.getWarning).toHaveBeenCalledWith('al-001');
      expect(result.id).toBe('al-001');
      expect(result.memory_content).toBe('Test memory');
    });

    it('should throw error for empty warning id', async () => {
      await expect(hook.getWarning('')).rejects.toThrow('Warning ID is required');
      await expect(hook.getWarning('   ')).rejects.toThrow('Warning ID is required');
    });
  });

  describe('decide', () => {
    it('should call deps.decide with all parameters', async () => {
      (mockDeps.decide as jest.Mock).mockResolvedValue(undefined);

      await hook.decide('al-001', 'keep', 'updated content', 'updated context');

      expect(mockDeps.decide).toHaveBeenCalledWith('al-001', 'keep', 'updated content', 'updated context');
    });

    it('should throw error for empty warning id', async () => {
      await expect(hook.decide('', 'keep')).rejects.toThrow('Warning ID is required');
    });

    it('should throw error for empty decision', async () => {
      await expect(hook.decide('al-001', '')).rejects.toThrow('Decision is required');
    });

    it('should accept valid decisions', async () => {
      (mockDeps.decide as jest.Mock).mockResolvedValue(undefined);

      const decisions = ['keep', 'delete', 'update'];
      for (const decision of decisions) {
        await expect(hook.decide('al-001', decision)).resolves.not.toThrow();
      }
    });
  });

  describe('stats', () => {
    it('should call deps.stats with agent_id', async () => {
      (mockDeps.stats as jest.Mock).mockResolvedValue({ pending: 3, total: 10 });

      const result = await hook.stats('test-agent');

      expect(mockDeps.stats).toHaveBeenCalledWith('test-agent');
      expect(result.pending).toBe(3);
      expect(result.total).toBe(10);
    });

    it('should handle zero stats', async () => {
      (mockDeps.stats as jest.Mock).mockResolvedValue({ pending: 0, total: 0 });

      const result = await hook.stats('empty-agent');

      expect(result.pending).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('pendingCount', () => {
    it('should return count of pending warnings', async () => {
      const mockWarnings: AlmostLostWarning[] = [
        { id: 'al-001', memory_id: 'mem-001', agent_id: 'test', memory_content: 'M1', created_at: '2026-05-01T10:00:00Z', decay_at: '2026-05-08T10:00:00Z', warning_at: '2026-05-04T10:00:00Z', importance_score: 0.5, last_accessed_at: '2026-05-01T10:00:00Z', access_count: 0, emotional_weight: 'medium', user_decision: 'pending', decided_at: '0001-01-01T00:00:00Z' },
        { id: 'al-002', memory_id: 'mem-002', agent_id: 'test', memory_content: 'M2', created_at: '2026-05-01T10:00:00Z', decay_at: '2026-05-08T10:00:00Z', warning_at: '2026-05-04T10:00:00Z', importance_score: 0.5, last_accessed_at: '2026-05-01T10:00:00Z', access_count: 0, emotional_weight: 'medium', user_decision: 'pending', decided_at: '0001-01-01T00:00:00Z' },
        { id: 'al-003', memory_id: 'mem-003', agent_id: 'test', memory_content: 'M3', created_at: '2026-05-01T10:00:00Z', decay_at: '2026-05-08T10:00:00Z', warning_at: '2026-05-04T10:00:00Z', importance_score: 0.5, last_accessed_at: '2026-05-01T10:00:00Z', access_count: 0, emotional_weight: 'medium', user_decision: 'keep', decided_at: '2026-05-04T12:00:00Z' },
      ];

      (mockDeps.listWarnings as jest.Mock).mockResolvedValue(mockWarnings);

      const count = await hook.pendingCount('test-agent');

      expect(count).toBe(2);
    });
  });
});
