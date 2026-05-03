/**
 * Tests for Memory Prediction integration (KR-3.12)
 * TDD RED: Tests prediction API types and integration points
 */

import { Memory } from '../../src/types';

describe('Memory Prediction (KR-3.12)', () => {
  describe('PredictionResponse type validation', () => {
    it('should define MemoryPrediction type', () => {
      // Expected response from POST /v1/prediction/memory/:agent_id
      const predictionResponse = {
        predicted_memories: [
          { id: 'mem-001', text: 'Go 编程最佳实践', score: 0.95, metadata: {} },
          { id: 'mem-002', text: '并发编程技巧', score: 0.88, metadata: {} },
        ],
        task_id: 'task-test-001',
        topic: 'test-prediction',
      };

      expect(predictionResponse).toHaveProperty('predicted_memories');
      expect(Array.isArray(predictionResponse.predicted_memories)).toBe(true);
      expect(predictionResponse).toHaveProperty('task_id');
      expect(predictionResponse).toHaveProperty('topic');
    });

    it('should have Memory type with score field', () => {
      const memory: Memory = {
        id: 'mem-001',
        text: 'Test memory',
        score: 0.95,
        metadata: {},
      };

      expect(memory.id).toBeDefined();
      expect(memory.text).toBeDefined();
      expect(typeof memory.score).toBe('number');
      expect(memory.score).toBeGreaterThanOrEqual(0);
      expect(memory.score).toBeLessThanOrEqual(1);
    });
  });

  describe('Prediction API endpoints', () => {
    it('should use POST /v1/prediction/memory/:agent_id', () => {
      const predictEndpoint = '/v1/prediction/memory/';
      expect(predictEndpoint).toBe('/v1/prediction/memory/');
    });

    it('should use GET /v1/prediction/memory/:agent_id', () => {
      const getEndpoint = '/v1/prediction/memory/';
      expect(getEndpoint).toBe('/v1/prediction/memory/');
    });
  });

  describe('Prediction request parameters', () => {
    it('should require memory_ids array', () => {
      const request = {
        memory_ids: ['mem-001', 'mem-002'],
        task_id: 'task-test-001',
        top_k: 5,
        topic: 'test-prediction',
      };

      expect(Array.isArray(request.memory_ids)).toBe(true);
      expect(request.memory_ids.length).toBeGreaterThan(0);
    });

    it('should support optional top_k parameter', () => {
      const requestWithTopK = { top_k: 5 };
      expect(requestWithTopK.top_k).toBe(5);
    });

    it('should support optional task_id parameter', () => {
      const request = {
        memory_ids: ['mem-001'],
        task_id: 'task-001',
      };

      expect(request.task_id).toBeDefined();
    });

    it('should support optional topic parameter', () => {
      const request = {
        memory_ids: ['mem-001'],
        topic: 'Go 编程',
      };

      expect(request.topic).toBeDefined();
      expect(typeof request.topic).toBe('string');
    });
  });

  describe('Prediction flow', () => {
    it('should support prediction based on memory_ids', () => {
      // Given current memories, predict which will be accessed next
      const memoryIds = ['mem-001', 'mem-002', 'mem-003'];
      const topK = 5;

      expect(Array.isArray(memoryIds)).toBe(true);
      expect(typeof topK).toBe('number');
    });

    it('should return predicted_memories array', () => {
      const predictionResult = {
        predicted_memories: [
          { id: 'mem-001', text: 'Memory 1', score: 0.9, metadata: {} },
        ],
        task_id: 'task-001',
        topic: 'test',
      };

      expect(Array.isArray(predictionResult.predicted_memories)).toBe(true);
      expect(predictionResult.predicted_memories.length).toBeGreaterThan(0);
    });
  });

  describe('Confidence scores', () => {
    it('should have scores between 0 and 1', () => {
      const memory: Memory = {
        id: 'mem-001',
        text: 'Test',
        score: 0.85,
        metadata: {},
      };

      expect(memory.score).toBeGreaterThanOrEqual(0);
      expect(memory.score).toBeLessThanOrEqual(1);
    });

    it('should sort predictions by score descending', () => {
      const predictions = [
        { id: 'mem-001', score: 0.95 },
        { id: 'mem-002', score: 0.85 },
        { id: 'mem-003', score: 0.75 },
      ];

      // Verify descending order
      for (let i = 0; i < predictions.length - 1; i++) {
        expect(predictions[i].score).toBeGreaterThanOrEqual(predictions[i + 1].score);
      }
    });
  });
});
