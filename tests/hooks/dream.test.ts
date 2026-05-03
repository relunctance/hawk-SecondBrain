/**
 * Tests for dream hook handler
 * TDD RED: These tests define expected behavior
 */

import { DreamHandler, DreamHandlerDeps, DreamResult } from '../../src/hooks/dream/handler';

describe('DreamHandler', () => {
  let handler: DreamHandler;

  const mockDeps: DreamHandlerDeps = {
    capture: async (text: string, metadata?: Record<string, unknown>) => {
      return { id: 'mem-dream-123', text, agent_id: 'test-agent', created_at: new Date().toISOString() };
    },
    generateInsights: async (context: string): Promise<string[]> => {
      return [
        'Consider the relationship between past and future actions',
        'Patterns emerge from repeated experiences',
      ];
    },
  };

  beforeEach(() => {
    handler = new DreamHandler(mockDeps);
  });

  describe('handle', () => {
    it('should process dream context and generate insights', async () => {
      const result: DreamResult = await handler.handle('Recent memories consolidation');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('consolidated');
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it('should capture consolidated memories', async () => {
      const result: DreamResult = await handler.handle('Test dream context');
      expect(result.consolidated).toHaveProperty('id');
      expect(result.consolidated).toHaveProperty('text');
    });

    it('should throw on empty context', async () => {
      await expect(handler.handle('')).rejects.toThrow('Context is required');
    });
  });

  describe('insights generation', () => {
    it('should return non-empty insights array', async () => {
      const result: DreamResult = await handler.handle('Test context');
      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('should handle generation errors gracefully', async () => {
      const errorDeps: DreamHandlerDeps = {
        capture: async (text: string) => {
          return { id: 'mem-error', text, agent_id: 'test', created_at: new Date().toISOString() };
        },
        generateInsights: async () => {
          throw new Error('LLM unavailable');
        },
      };
      const errorHandler = new DreamHandler(errorDeps);
      const result: DreamResult = await errorHandler.handle('Test');
      // Should still return result with empty insights on error
      expect(result).toHaveProperty('insights');
    });
  });
});
