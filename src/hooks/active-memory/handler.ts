/**
 * Active Memory Hook Handler - KR-3.15 Integration
 *
 * Handles Active Memory operations: listEntries, getEntry, markRead, dismiss, submitFeedback, trigger.
 */

import {
  ActiveMemoryEntry,
  ActivePreferences,
  ListEntriesResponse,
  PushMetrics,
  TriggerResponse,
  TriggerTypes,
} from './types';

export interface ActiveMemoryHookDeps {
  listEntries: (params: { agent_id: string; limit: number }) => Promise<ListEntriesResponse>;
  getEntry: (id: string) => Promise<ActiveMemoryEntry>;
  markRead: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  submitFeedback: (id: string, feedback: string) => Promise<void>;
  trigger: (params: {
    agent_id: string;
    trigger_type: string;
    trigger_signal: string;
  }) => Promise<TriggerResponse>;
  getPreferences: (agent_id: string) => Promise<ActivePreferences>;
  updatePreferences: (prefs: ActivePreferences) => Promise<void>;
  getMetrics: (agent_id: string, date: string) => Promise<PushMetrics>;
}

export class ActiveMemoryHook {
  private deps: ActiveMemoryHookDeps;

  constructor(deps: ActiveMemoryHookDeps) {
    this.deps = deps;
  }

  /**
   * List active memory entries
   * GET /v1/active/entries
   */
  async listEntries(agent_id: string = 'default', limit: number = 50): Promise<ListEntriesResponse> {
    const resolvedAgentId = !agent_id || agent_id.trim().length === 0 ? 'default' : agent_id;
    const resolvedLimit = limit > 0 ? limit : 50;
    return this.deps.listEntries({ agent_id: resolvedAgentId, limit: resolvedLimit });
  }

  /**
   * Get a single active memory entry by ID
   * GET /v1/active/entries/:id
   */
  async getEntry(id: string): Promise<ActiveMemoryEntry> {
    if (!id || id.trim().length === 0) {
      throw new Error('Entry ID is required');
    }
    return this.deps.getEntry(id);
  }

  /**
   * Mark an entry as read
   * POST /v1/active/entries/:id/read
   */
  async markRead(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Entry ID is required');
    }
    return this.deps.markRead(id);
  }

  /**
   * Dismiss an entry
   * POST /v1/active/entries/:id/dismiss
   */
  async dismiss(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Entry ID is required');
    }
    return this.deps.dismiss(id);
  }

  /**
   * Submit feedback for an entry
   * POST /v1/active/entries/:id/feedback
   */
  async submitFeedback(id: string, feedback: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Entry ID is required');
    }
    if (!feedback || feedback.trim().length === 0) {
      throw new Error('Feedback is required');
    }
    const validFeedbacks = ['useful', 'not_useful', 'irrelevant'];
    if (!validFeedbacks.includes(feedback)) {
      throw new Error('Feedback must be one of: useful, not_useful, irrelevant');
    }
    return this.deps.submitFeedback(id, feedback);
  }

  /**
   * Manually trigger an active memory push
   * POST /v1/active/trigger
   */
  async trigger(
    agent_id: string = 'default',
    trigger_type: string = TriggerTypes.MilestoneDueSoon,
    trigger_signal: string
  ): Promise<TriggerResponse> {
    if (!trigger_signal || trigger_signal.trim().length === 0) {
      throw new Error('Trigger signal is required');
    }
    const resolvedAgentId = !agent_id || agent_id.trim().length === 0 ? 'default' : agent_id;
    const resolvedTriggerType = !trigger_type || trigger_type.trim().length === 0 ? TriggerTypes.MilestoneDueSoon : trigger_type;
    return this.deps.trigger({
      agent_id: resolvedAgentId,
      trigger_type: resolvedTriggerType,
      trigger_signal,
    });
  }

  /**
   * Get user push preferences
   * GET /v1/active/preferences
   */
  async getPreferences(agent_id: string = 'default'): Promise<ActivePreferences> {
    const resolvedAgentId = !agent_id || agent_id.trim().length === 0 ? 'default' : agent_id;
    return this.deps.getPreferences(resolvedAgentId);
  }

  /**
   * Update user push preferences
   * PUT /v1/active/preferences
   */
  async updatePreferences(prefs: ActivePreferences): Promise<void> {
    if (!prefs || !prefs.agent_id || prefs.agent_id.trim().length === 0) {
      throw new Error('Preferences agent_id is required');
    }
    return this.deps.updatePreferences(prefs);
  }

  /**
   * Get push metrics for a date
   * GET /v1/active/metrics
   */
  async getMetrics(agent_id: string = 'default', date?: string): Promise<PushMetrics> {
    const resolvedAgentId = !agent_id || agent_id.trim().length === 0 ? 'default' : agent_id;
    const resolvedDate = !date || date.trim().length === 0
      ? new Date().toISOString().split('T')[0]
      : date;
    return this.deps.getMetrics(resolvedAgentId, resolvedDate);
  }
}
