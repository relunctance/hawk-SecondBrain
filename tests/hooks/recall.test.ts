/**
 * Tests for recall hook handler
 * TDD RED: These tests define expected behavior
 */

import { RecallHandler, RecallHandlerDeps } from '../../src/hooks/recall/handler';

describe('RecallHandler', () => {
  let handler: RecallHandler;

  const mockDeps: RecallHandlerDeps = {
    recall: async (query: string, top_k: number = 5) => {
      return {
        memories: [
          { id: 'mem-1', text: 'Test memory 1', score: 0.95, metadata: {} },
          { id: 'mem-2', text: 'Test memory 2', score: 0.85, metadata: {} },
        ],
        query,
      };
    },
  };

  beforeEach(() => {
    handler = new RecallHandler(mockDeps);
  });

  describe('handle', () => {
    it('should recall memories for a query', async () => {
      const result = await handler.handle('test query');
      expect(result).toHaveProperty('memories');
      expect(result).toHaveProperty('query', 'test query');
      expect(Array.isArray(result.memories)).toBe(true);
      expect(result.memories.length).toBeGreaterThan(0);
    });

    it('should use default top_k of 5', async () => {
      const result = await handler.handle('test');
      expect(result.memories.length).toBeLessThanOrEqual(5);
    });

    it('should throw on empty query', async () => {
      await expect(handler.handle('')).rejects.toThrow('Query is required');
    });

    it('should handle client errors gracefully', async () => {
      const errorDeps: RecallHandlerDeps = {
        recall: async () => {
          throw new Error('Network error');
        },
      };
      const errorHandler = new RecallHandler(errorDeps);
      await expect(errorHandler.handle('test')).rejects.toThrow('Network error');
    });
  });

  describe('memories structure', () => {
    it('should return memories with required fields', async () => {
      const result = await handler.handle('test');
      for (const memory of result.memories) {
        expect(typeof memory.id).toBe('string');
        expect(typeof memory.text).toBe('string');
        expect(typeof memory.score).toBe('number');
        expect(memory.score).toBeGreaterThanOrEqual(0);
        expect(memory.score).toBeLessThanOrEqual(1);
      }
    });
  });
});
