/**
 * Active Memory Types - KR-3.15 Integration
 *
 * Type definitions matching hawk-memory internal/active_memory/types.go
 */

// ─── TriggerType constants ───────────────────────────────────────────────────

export const TriggerTypes = {
  // Temporal signals
  MilestoneDueSoon: 'milestone_due_soon',
  MilestoneOverdue: 'milestone_overdue',
  GoalDueSoon: 'goal_due_soon',
  GoalOverdue: 'goal_overdue',
  StalledGoal: 'stalled_goal',
  RecurringDue: 'recurring_due',

  // Contextual signals
  GoalProgressUpdate: 'goal_progress_update',
  BlockerAppeared: 'blocker_appeared',
  BlockerResolved: 'blocker_resolved',
  OnTrackChange: 'on_track_change',
  MilestoneCompleted: 'milestone_completed',
  WorkingMemoryTopic: 'working_memory_topic',

  // External signals
  ExternalEvent: 'external_event',
  CollaborationMention: 'collaboration_mention',

  // Predictive signals
  PredictedNeed: 'predicted_need',
  TaskContext: 'task_context',

  // Contradictory signals
  Contradiction: 'contradiction',
  DecisionReversal: 'decision_reversal',

  // Inactive follow-up
  InactiveFollow: 'inactive_follow',
} as const;

export type TriggerType = typeof TriggerTypes[keyof typeof TriggerTypes];

// ─── Status constants ───────────────────────────────────────────────────────

export const StatusTypes = {
  PendingGeneration: 'pending_generation',
  Queued: 'queued',
  Delivered: 'delivered',
  Seen: 'seen',
  Dismissed: 'dismissed',
  Expired: 'expired',
  Skipped: 'skipped',
} as const;

export type StatusType = typeof StatusTypes[keyof typeof StatusTypes];

// ─── Priority constants ──────────────────────────────────────────────────────

export const PriorityLevels = {
  Low: 1,
  Medium: 2,
  High: 3,
  Urgent: 4,
} as const;

export type PriorityLevel = typeof PriorityLevels[keyof typeof PriorityLevels];

// ─── Trigger ─────────────────────────────────────────────────────────────────

export interface Trigger {
  id: string;
  agent_id: string;
  trigger_type: TriggerType;
  goal_id?: string;
  milestone_id?: string;
  trigger_signal: string;
  memory_ids: string[];
  priority: PriorityLevel;
  scheduled_at?: string;
  generation_reason?: string;
}

// ─── ActiveMemoryEntry ───────────────────────────────────────────────────────

export interface ActiveMemoryEntry {
  id: string;
  agent_id: string;
  trigger_type: TriggerType;
  trigger_signal: string;
  push_title: string;
  push_body: string;
  push_summary: string;
  priority: PriorityLevel;
  status: StatusType;
  created_at: string;
  delivered_at?: string | null;
  seen_at?: string | null;
  dismissed_at?: string | null;
  feedback?: string | null;
  read_at?: string | null;
}

// ─── ListEntriesResponse ─────────────────────────────────────────────────────

export interface ListEntriesResponse {
  entries: ActiveMemoryEntry[];
  total: number;
}

// ─── TriggerResponse ──────────────────────────────────────────────────────────

export interface TriggerResponse {
  entry_id: string;
  status: StatusType;
  push_title: string;
}

// ─── UserPushPreferences ─────────────────────────────────────────────────────

export interface ActivePreferences {
  id: string;
  agent_id: string;
  enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  max_daily_pushes?: number;
  webhook_url?: string;
}

// ─── PushMetrics ─────────────────────────────────────────────────────────────

export interface PushMetrics {
  agent_id: string;
  date: string;
  pushed: number;
  delivered: number;
  seen: number;
  dismissed: number;
  useful: number;
  not_useful: number;
  irrelevant: number;
  open_rate?: number;
  useful_rate?: number;
}
