/**
 * Active Memory Hook Handler Test - KR-3.15 Integration (TDD)
 *
 * Tests for Active Memory Hook: listEntries, getEntry, markRead, dismiss, submitFeedback, trigger.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ActiveMemoryHook, type ActiveMemoryHookDeps } from '../../src/hooks/active-memory/handler';
import type { ActiveMemoryEntry, ActivePreferences, PushMetrics } from '../../src/hooks/active-memory/types';

const mockEntry: ActiveMemoryEntry = {
  id: 'ame-test-001',
  agent_id: 'test-agent',
  trigger_type: 'milestone_due_soon',
  trigger_signal: '里程碑即将到期',
  push_title: '里程碑即将到期',
  push_body: '您的里程碑"完成第一版"将在明天到期',
  push_summary: '1个里程碑即将到期',
  priority: 2,
  status: 'pending_generation',
  created_at: '2026-05-04T10:00:00Z',
  delivered_at: null,
  seen_at: null,
  dismissed_at: null,
  feedback: null,
  read_at: null,
};

const mockPreferences: ActivePreferences = {
  id: 'upp-test-agent',
  agent_id: 'test-agent',
  enabled: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  max_daily_pushes: 10,
  webhook_url: 'https://example.com/webhook',
};

const mockMetrics: PushMetrics = {
  agent_id: 'test-agent',
  date: '2026-05-04',
  pushed: 5,
  delivered: 3,
  seen: 1,
  dismissed: 1,
  useful: 2,
  not_useful: 0,
  irrelevant: 1,
  open_rate: 0.8,
  useful_rate: 0.667,
};

const mockDeps: ActiveMemoryHookDeps = {
  listEntries: jest.fn().mockResolvedValue({ entries: [mockEntry], total: 1 }),
  getEntry: jest.fn().mockResolvedValue(mockEntry),
  markRead: jest.fn().mockResolvedValue(undefined),
  dismiss: jest.fn().mockResolvedValue(undefined),
  submitFeedback: jest.fn().mockResolvedValue(undefined),
  trigger: jest.fn().mockResolvedValue({ entry_id: 'ame-test-002', status: 'queued', push_title: '手动触发测试' }),
  getPreferences: jest.fn().mockResolvedValue(mockPreferences),
  updatePreferences: jest.fn().mockResolvedValue(undefined),
  getMetrics: jest.fn().mockResolvedValue(mockMetrics),
};

describe('ActiveMemoryHook', () => {
  let hook: ActiveMemoryHook;

  beforeEach(() => {
    jest.clearAllMocks();
    hook = new ActiveMemoryHook(mockDeps);
  });

  describe('listEntries', () => {
    it('should list entries with default limit', async () => {
      const result = await hook.listEntries();
      expect(result.entries).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockDeps.listEntries).toHaveBeenCalledWith({ agent_id: 'default', limit: 50 });
    });

    it('should list entries with custom agent_id and limit', async () => {
      await hook.listEntries('custom-agent', 20);
      expect(mockDeps.listEntries).toHaveBeenCalledWith({ agent_id: 'custom-agent', limit: 20 });
    });

    it('should use default agent_id if empty string provided', async () => {
      await hook.listEntries('');
      expect(mockDeps.listEntries).toHaveBeenCalledWith({ agent_id: 'default', limit: 50 });
    });
  });

  describe('getEntry', () => {
    it('should get entry by id', async () => {
      const result = await hook.getEntry('ame-test-001');
      expect(result.id).toBe('ame-test-001');
      expect(mockDeps.getEntry).toHaveBeenCalledWith('ame-test-001');
    });

    it('should throw error if id is empty', async () => {
      await expect(hook.getEntry('')).rejects.toThrow('Entry ID is required');
      await expect(hook.getEntry('   ')).rejects.toThrow('Entry ID is required');
    });
  });

  describe('markRead', () => {
    it('should mark entry as read', async () => {
      await expect(hook.markRead('ame-test-001')).resolves.toBeUndefined();
      expect(mockDeps.markRead).toHaveBeenCalledWith('ame-test-001');
    });

    it('should throw error if id is empty', async () => {
      await expect(hook.markRead('')).rejects.toThrow('Entry ID is required');
      await expect(hook.markRead('   ')).rejects.toThrow('Entry ID is required');
    });
  });

  describe('dismiss', () => {
    it('should dismiss entry', async () => {
      await expect(hook.dismiss('ame-test-001')).resolves.toBeUndefined();
      expect(mockDeps.dismiss).toHaveBeenCalledWith('ame-test-001');
    });

    it('should throw error if id is empty', async () => {
      await expect(hook.dismiss('')).rejects.toThrow('Entry ID is required');
      await expect(hook.dismiss('   ')).rejects.toThrow('Entry ID is required');
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback', async () => {
      await expect(hook.submitFeedback('ame-test-001', 'useful')).resolves.toBeUndefined();
      expect(mockDeps.submitFeedback).toHaveBeenCalledWith('ame-test-001', 'useful');
    });

    it('should throw error if id is empty', async () => {
      await expect(hook.submitFeedback('', 'useful')).rejects.toThrow('Entry ID is required');
    });

    it('should throw error if feedback is empty', async () => {
      await expect(hook.submitFeedback('ame-test-001', '')).rejects.toThrow('Feedback is required');
      await expect(hook.submitFeedback('ame-test-001', '   ')).rejects.toThrow('Feedback is required');
    });

    it('should accept valid feedback values', async () => {
      const validFeedbacks = ['useful', 'not_useful', 'irrelevant'];
      for (const fb of validFeedbacks) {
        jest.clearAllMocks();
        await expect(hook.submitFeedback('ame-test-001', fb)).resolves.toBeUndefined();
        expect(mockDeps.submitFeedback).toHaveBeenCalledWith('ame-test-001', fb);
      }
    });
  });

  describe('trigger', () => {
    it('should trigger active memory with required params', async () => {
      const result = await hook.trigger('test-agent', 'milestone_due_soon', '手动触发测试');
      expect(result.entry_id).toBe('ame-test-002');
      expect(result.status).toBe('queued');
      expect(mockDeps.trigger).toHaveBeenCalledWith({
        agent_id: 'test-agent',
        trigger_type: 'milestone_due_soon',
        trigger_signal: '手动触发测试',
      });
    });

    it('should use default agent_id if empty string', async () => {
      await hook.trigger('', 'milestone_due_soon', 'test');
      expect(mockDeps.trigger).toHaveBeenCalledWith({
        agent_id: 'default',
        trigger_type: 'milestone_due_soon',
        trigger_signal: 'test',
      });
    });

    it('should use default trigger_type if empty string', async () => {
      await hook.trigger('test-agent', '', 'test');
      expect(mockDeps.trigger).toHaveBeenCalledWith({
        agent_id: 'test-agent',
        trigger_type: 'milestone_due_soon',
        trigger_signal: 'test',
      });
    });

    it('should throw error if trigger_signal is empty', async () => {
      await expect(hook.trigger('test-agent', 'milestone_due_soon', '')).rejects.toThrow('Trigger signal is required');
      await expect(hook.trigger('test-agent', 'milestone_due_soon', '   ')).rejects.toThrow('Trigger signal is required');
    });
  });

  describe('getPreferences', () => {
    it('should get preferences with default agent_id', async () => {
      const result = await hook.getPreferences();
      expect(result.agent_id).toBe('test-agent');
      expect(mockDeps.getPreferences).toHaveBeenCalledWith('default');
    });

    it('should get preferences with custom agent_id', async () => {
      await hook.getPreferences('custom-agent');
      expect(mockDeps.getPreferences).toHaveBeenCalledWith('custom-agent');
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences', async () => {
      await expect(hook.updatePreferences(mockPreferences)).resolves.toBeUndefined();
      expect(mockDeps.updatePreferences).toHaveBeenCalledWith(mockPreferences);
    });

    it('should throw error if preferences are invalid', async () => {
      await expect(hook.updatePreferences({} as any)).rejects.toThrow('Preferences agent_id is required');
    });
  });

  describe('getMetrics', () => {
    it('should get metrics with default agent_id and today date', async () => {
      const result = await hook.getMetrics();
      expect(result.agent_id).toBe('test-agent');
      expect(result.pushed).toBe(5);
      expect(mockDeps.getMetrics).toHaveBeenCalledWith('default', expect.any(String));
    });

    it('should get metrics with custom agent_id and date', async () => {
      await hook.getMetrics('custom-agent', '2026-05-01');
      expect(mockDeps.getMetrics).toHaveBeenCalledWith('custom-agent', '2026-05-01');
    });
  });
});
