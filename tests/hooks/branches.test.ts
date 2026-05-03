/**
 * Branching Hook Handler - TDD Tests
 *
 * Tests for Memory Branching:
 * - createBranch()
 * - listBranches()
 * - getBranch()
 * - deleteBranch()
 * - mergeBranch()
 */

import { BranchingHandler, BranchingHandlerDeps } from '../../src/hooks/branches/handler';

describe('BranchingHandler', () => {
  // Mock HawkMemoryClient
  const mockClient = {
    createBranch: jest.fn(),
    listBranches: jest.fn(),
    getBranch: jest.fn(),
    deleteBranch: jest.fn(),
    mergeBranch: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockDeps: BranchingHandlerDeps = {
    client: mockClient as any,
    logger: mockLogger as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── createBranch ───────────────────────────────────────────────────────

  describe('createBranch()', () => {
    it('should create a what_if branch successfully', async () => {
      const mockBranch = {
        id: 'branch-123',
        agent_id: 'test-agent',
        name: 'what-if-react-alternative',
        branch_type: 'what_if',
        created_at: '2026-05-04T10:00:00Z',
      };
      (mockClient.createBranch as jest.Mock).mockResolvedValue(mockBranch);

      const handler = new BranchingHandler(mockDeps);
      const result = await handler.createBranch({
        agentId: 'test-agent',
        branchName: 'what-if-react-alternative',
        branchType: 'what_if',
      });

      expect(result).toEqual(mockBranch);
      expect(mockClient.createBranch).toHaveBeenCalledWith({
        agentId: 'test-agent',
        branchName: 'what-if-react-alternative',
        branchType: 'what_if',
      });
    });

    it('should create an alternative_decision branch', async () => {
      const mockBranch = {
        id: 'branch-456',
        agent_id: 'test-agent',
        name: 'usezustand',
        branch_type: 'alternative_decision',
        created_at: '2026-05-04T10:00:00Z',
      };
      (mockClient.createBranch as jest.Mock).mockResolvedValue(mockBranch);

      const handler = new BranchingHandler(mockDeps);
      const result = await handler.createBranch({
        agentId: 'test-agent',
        branchName: 'usezustand',
        branchType: 'alternative_decision',
      });

      expect(result.branch_type).toBe('alternative_decision');
    });

    it('should create an exploration branch', async () => {
      const mockBranch = {
        id: 'branch-789',
        agent_id: 'test-agent',
        name: 'explore-new-architecture',
        branch_type: 'exploration',
        created_at: '2026-05-04T10:00:00Z',
      };
      (mockClient.createBranch as jest.Mock).mockResolvedValue(mockBranch);

      const handler = new BranchingHandler(mockDeps);
      const result = await handler.createBranch({
        agentId: 'test-agent',
        branchName: 'explore-new-architecture',
        branchType: 'exploration',
      });

      expect(result.branch_type).toBe('exploration');
    });

    it('should throw on invalid branch_type', async () => {
      (mockClient.createBranch as jest.Mock).mockRejectedValue(new Error('invalid branch_type: unknown'));

      const handler = new BranchingHandler(mockDeps);
      await expect(
        handler.createBranch({
          agentId: 'test-agent',
          branchName: 'test-branch',
          branchType: 'unknown' as any,
        })
      ).rejects.toThrow('invalid branch_type');
    });

    it('should throw when client fails', async () => {
      (mockClient.createBranch as jest.Mock).mockRejectedValue(new Error('network error'));

      const handler = new BranchingHandler(mockDeps);
      await expect(
        handler.createBranch({
          agentId: 'test-agent',
          branchName: 'test-branch',
          branchType: 'what_if',
        })
      ).rejects.toThrow('network error');
    });
  });

  // ─── listBranches ────────────────────────────────────────────────────────

  describe('listBranches()', () => {
    it('should list all branches for an agent', async () => {
      const mockBranches = [
        { id: 'b1', name: 'branch-1', branch_type: 'what_if' },
        { id: 'b2', name: 'branch-2', branch_type: 'alternative_decision' },
      ];
      (mockClient.listBranches as jest.Mock).mockResolvedValue(mockBranches);

      const handler = new BranchingHandler(mockDeps);
      const result = await handler.listBranches('test-agent');

      expect(result).toHaveLength(2);
      expect(mockClient.listBranches).toHaveBeenCalledWith('test-agent');
    });

    it('should return empty array when no branches exist', async () => {
      (mockClient.listBranches as jest.Mock).mockResolvedValue([]);

      const handler = new BranchingHandler(mockDeps);
      const result = await handler.listBranches('new-agent');

      expect(result).toEqual([]);
    });
  });

  // ─── getBranch ──────────────────────────────────────────────────────────

  describe('getBranch()', () => {
    it('should get a branch by id with memories', async () => {
      const mockBranch = {
        id: 'branch-123',
        name: 'test-branch',
        branch_type: 'what_if',
        branch_memories: [{ id: 'm1', text: 'memory in branch' }],
      };
      (mockClient.getBranch as jest.Mock).mockResolvedValue(mockBranch);

      const handler = new BranchingHandler(mockDeps);
      const result = await handler.getBranch('branch-123');

      expect(result.id).toBe('branch-123');
      expect(result.branch_memories).toHaveLength(1);
    });

    it('should throw when branch not found', async () => {
      (mockClient.getBranch as jest.Mock).mockRejectedValue(new Error('branch not found'));

      const handler = new BranchingHandler(mockDeps);
      await expect(handler.getBranch('nonexistent')).rejects.toThrow('branch not found');
    });
  });

  // ─── deleteBranch ───────────────────────────────────────────────────────

  describe('deleteBranch()', () => {
    it('should delete a branch successfully', async () => {
      (mockClient.deleteBranch as jest.Mock).mockResolvedValue({ branch_id: 'branch-123', status: 'discarded' });

      const handler = new BranchingHandler(mockDeps);
      const result = await handler.deleteBranch('branch-123');

      expect(result.status).toBe('discarded');
      expect(mockClient.deleteBranch).toHaveBeenCalledWith('branch-123');
    });

    it('should throw when delete fails', async () => {
      (mockClient.deleteBranch as jest.Mock).mockRejectedValue(new Error('delete failed'));

      const handler = new BranchingHandler(mockDeps);
      await expect(handler.deleteBranch('branch-123')).rejects.toThrow('delete failed');
    });
  });

  // ─── mergeBranch ───────────────────────────────────────────────────────

  describe('mergeBranch()', () => {
    it('should merge a branch successfully', async () => {
      (mockClient.mergeBranch as jest.Mock).mockResolvedValue({
        branch_id: 'branch-123',
        merged_into: 'main',
        status: 'merged',
      });

      const handler = new BranchingHandler(mockDeps);
      const result = await handler.mergeBranch('branch-123', 'main');

      expect(result.status).toBe('merged');
      expect(mockClient.mergeBranch).toHaveBeenCalledWith('branch-123', 'main');
    });

    it('should throw when merge fails', async () => {
      (mockClient.mergeBranch as jest.Mock).mockRejectedValue(new Error('merge failed'));

      const handler = new BranchingHandler(mockDeps);
      await expect(handler.mergeBranch('branch-123', 'main')).rejects.toThrow('merge failed');
    });
  });
});
