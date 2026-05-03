/**
 * TIL Hook Tests - KR-3.7 TDD (RED phase)
 * These tests define expected TIL hook behavior.
 */

import { TILHook, TILHookDeps } from '../../src/hooks/til/handler';

describe('TILHook', () => {
  let hook: TILHook;
  let mockDeps: TILHookDeps;

  const mockTILEntry = {
    id: 'til-123',
    agent_id: 'agent-1',
    date: '2026-05-04',
    period: 'daily',
    before_statement: '之前以为喝咖啡会失眠',
    after_statement: '现在知道适量咖啡其实不影响睡眠',
    refresh_type: 'correction',
    source_memory_ids: ['mem-1', 'mem-2'],
    source_summary: '关于咖啡因对睡眠影响的学习',
    shareability: 0.7,
    impact_score: 0.8,
    topic: '咖啡与睡眠',
    tags: ['健康', '咖啡'],
    created_at: '2026-05-04T10:00:00Z',
  };

  beforeEach(() => {
    mockDeps = {
      createTIL: jest.fn(),
      getTIL: jest.fn(),
      listTILByAgent: jest.fn(),
      listTILByDate: jest.fn(),
      deleteTIL: jest.fn(),
    };
    hook = new TILHook(mockDeps);
  });

  describe('create', () => {
    it('should create a TIL entry', async () => {
      const entry = {
        agent_id: 'agent-1',
        date: '2026-05-04',
        before_statement: '之前以为...',
        after_statement: '现在知道...',
        topic: '测试主题',
      };
      const mockResponse = { id: 'til-123' };
      (mockDeps.createTIL as jest.Mock).mockResolvedValue(mockResponse);

      const result = await hook.create(entry);

      expect(mockDeps.createTIL).toHaveBeenCalledWith(entry);
      expect(result).toEqual(mockResponse);
    });

    it('should pass optional fields through', async () => {
      const entry = {
        agent_id: 'agent-1',
        date: '2026-05-04',
        before_statement: '之前以为...',
        after_statement: '现在知道...',
        topic: '测试',
        period: 'weekly' as const,
        refresh_type: 'paradigm_shift' as const,
        tags: ['tag1'],
      };
      (mockDeps.createTIL as jest.Mock).mockResolvedValue({ id: 'til-456' });

      await hook.create(entry);

      expect(mockDeps.createTIL).toHaveBeenCalledWith(entry);
    });
  });

  describe('get', () => {
    it('should get a TIL entry by id', async () => {
      (mockDeps.getTIL as jest.Mock).mockResolvedValue(mockTILEntry);

      const result = await hook.get('til-123');

      expect(mockDeps.getTIL).toHaveBeenCalledWith('til-123');
      expect(result).toEqual(mockTILEntry);
    });

    it('should throw on empty id', async () => {
      await expect(hook.get('')).rejects.toThrow('TIL ID is required');
      await expect(hook.get('   ')).rejects.toThrow('TIL ID is required');
    });

    it('should propagate client errors', async () => {
      (mockDeps.getTIL as jest.Mock).mockRejectedValue(new Error('Not found'));

      await expect(hook.get('til-999')).rejects.toThrow('Not found');
    });
  });

  describe('listByAgent', () => {
    it('should list TIL entries with default limit 20', async () => {
      const mockResponse = { til_entries: [mockTILEntry], count: 1 };
      (mockDeps.listTILByAgent as jest.Mock).mockResolvedValue(mockResponse);

      const result = await hook.listByAgent();

      expect(mockDeps.listTILByAgent).toHaveBeenCalledWith(20);
      expect(result).toEqual(mockResponse);
    });

    it('should respect custom limit', async () => {
      (mockDeps.listTILByAgent as jest.Mock).mockResolvedValue({ til_entries: [], count: 0 });

      await hook.listByAgent(10);

      expect(mockDeps.listTILByAgent).toHaveBeenCalledWith(10);
    });

    it('should throw on non-positive limit', async () => {
      await expect(hook.listByAgent(0)).rejects.toThrow('Limit must be positive');
      await expect(hook.listByAgent(-1)).rejects.toThrow('Limit must be positive');
    });
  });

  describe('listByDate', () => {
    it('should list TIL entries by agent and date', async () => {
      const mockResponse = { til_entries: [mockTILEntry], count: 1 };
      (mockDeps.listTILByDate as jest.Mock).mockResolvedValue(mockResponse);

      const result = await hook.listByDate('2026-05-04');

      expect(mockDeps.listTILByDate).toHaveBeenCalledWith('2026-05-04', 20);
      expect(result).toEqual(mockResponse);
    });

    it('should respect custom limit', async () => {
      (mockDeps.listTILByDate as jest.Mock).mockResolvedValue({ til_entries: [], count: 0 });

      await hook.listByDate('2026-05-04', 5);

      expect(mockDeps.listTILByDate).toHaveBeenCalledWith('2026-05-04', 5);
    });

    it('should throw on empty date', async () => {
      await expect(hook.listByDate('')).rejects.toThrow('Date is required');
      await expect(hook.listByDate('   ')).rejects.toThrow('Date is required');
    });

    it('should throw on non-positive limit', async () => {
      await expect(hook.listByDate('2026-05-04', 0)).rejects.toThrow('Limit must be positive');
    });
  });

  describe('delete', () => {
    it('should delete a TIL entry', async () => {
      (mockDeps.deleteTIL as jest.Mock).mockResolvedValue(undefined);

      await hook.delete('til-123');

      expect(mockDeps.deleteTIL).toHaveBeenCalledWith('til-123');
    });

    it('should throw on empty id', async () => {
      await expect(hook.delete('')).rejects.toThrow('TIL ID is required');
      await expect(hook.delete('   ')).rejects.toThrow('TIL ID is required');
    });
  });
});
