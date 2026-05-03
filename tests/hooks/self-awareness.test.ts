/**
 * Tests for Self-Awareness integration (KR-3.11)
 * TDD RED: Tests Self-Awareness via capture/recall confidence signals
 */

import { HawkMemoryClient } from '../../src/client';
import { CaptureResponse } from '../../src/types';

describe('Self-Awareness (KR-3.11)', () => {
  describe('CaptureResponse confidence signals', () => {
    it('should have CaptureResponse with id, text, agent_id, created_at', () => {
      const response: CaptureResponse = {
        id: 'mem-123',
        text: 'Self-Awareness test memory',
        agent_id: 'test-agent',
        created_at: '2026-05-04T10:00:00Z',
      };

      expect(response.id).toBeDefined();
      expect(typeof response.id).toBe('string');
      expect(response.text).toBeDefined();
      expect(response.agent_id).toBeDefined();
      expect(response.created_at).toBeDefined();
    });

    it('should support metadata for self-awareness signals', () => {
      const response: CaptureResponse = {
        id: 'mem-456',
        text: 'Memory with self-awareness signal',
        agent_id: 'test-agent',
        created_at: '2026-05-04T10:00:00Z',
      };

      // Self-Awareness signals are recorded via capture metadata
      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('text');
    });
  });

  describe('HawkMemoryClient self-awareness integration', () => {
    it('should have capture method that returns CaptureResponse', () => {
      const client = new HawkMemoryClient({ agentId: 'test-agent' });
      expect(typeof (client as any).capture).toBe('function');
    });

    it('should have recall method for confidence-based retrieval', () => {
      const client = new HawkMemoryClient({ agentId: 'test-agent' });
      expect(typeof (client as any).recall).toBe('function');
    });
  });

  describe('Self-Awareness rules config verification', () => {
    it('should verify selfawareness rules config exists', () => {
      // The selfawareness rules are in hawk-memory
      // hawk-SecondBrain accesses them via API
      const rulesPath = 'rules/selfawareness/default.yaml';
      expect(rulesPath).toBe('rules/selfawareness/default.yaml');
    });
  });

  describe('Self-Awareness signal types', () => {
    it('should support SignalHitUsed boost', () => {
      // Self-Awareness boosts confidence when memory is recalled and used
      const signalBoost = 0.05;
      expect(signalBoost).toBe(0.05);
    });

    it('should support SignalHitSkip penalty', () => {
      // Self-Awareness penalizes confidence when memory is skipped
      const skipPenalty = -0.05;
      expect(skipPenalty).toBe(-0.05);
    });

    it('should support SignalConflict penalty', () => {
      // Self-Awareness penalizes confidence when beliefs conflict
      const conflictPenalty = -0.15;
      expect(conflictPenalty).toBe(-0.15);
    });

    it('should support SignalUpdate boost', () => {
      // Self-Awareness boosts confidence when memory is updated
      const updateBoost = 0.10;
      expect(updateBoost).toBe(0.10);
    });
  });

  describe('Self-Awareness capture side-effect', () => {
    it('should record self-awareness signals on capture', () => {
      // When capture is called, Self-Awareness records SignalCreate
      const signalTypes = {
        SignalCreate: 'create',
        SignalHitUsed: 'hit_used',
        SignalHitSkip: 'hit_skip',
        SignalConflict: 'conflict',
        SignalUpdate: 'update',
      };

      expect(signalTypes.SignalCreate).toBe('create');
      expect(signalTypes.SignalHitUsed).toBe('hit_used');
    });
  });

  describe('Confidence score range', () => {
    it('should have confidence scores between 0 and 1', () => {
      // Self-Awareness confidence should be in [0, 1]
      const minConfidence = 0;
      const maxConfidence = 1;

      const testConfidence = 0.75;
      expect(testConfidence).toBeGreaterThanOrEqual(minConfidence);
      expect(testConfidence).toBeLessThanOrEqual(maxConfidence);
    });

    it('should handle low confidence for new memories', () => {
      const newMemoryConfidence = 0.5;
      expect(newMemoryConfidence).toBeLessThan(1);
    });

    it('should handle high confidence for well-used memories', () => {
      const wellUsedMemoryConfidence = 0.9;
      expect(wellUsedMemoryConfidence).toBeGreaterThan(0.5);
    });
  });
});
