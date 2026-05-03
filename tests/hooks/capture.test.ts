/**
 * Tests for capture hook handler
 * TDD RED: These tests define expected behavior
 */

// We need to mock before importing the handler
const mockCaptureFn = jest.fn();

jest.mock('../../src/client', () => ({
  HawkMemoryClient: jest.fn().mockImplementation(() => ({
    capture: mockCaptureFn,
  })),
}));

// Import after mock
import { CaptureHandler, CaptureHandlerDeps } from '../../src/hooks/capture/handler';

describe('CaptureHandler', () => {
  let handler: CaptureHandler;

  const mockDeps: CaptureHandlerDeps = {
    capture: async (text: string, metadata?: Record<string, unknown>) => {
      return { id: 'mem-123', text, agent_id: 'test-agent', created_at: new Date().toISOString() };
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new CaptureHandler(mockDeps);
  });

  describe('handle', () => {
    it('should capture a memory with text', async () => {
      const result = await handler.handle('Test memory content');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('text', 'Test memory content');
      expect(result).toHaveProperty('agent_id');
      expect(result).toHaveProperty('created_at');
    });

    it('should include metadata when provided', async () => {
      const metadata = { source: 'test', type: 'user-input' };
      const result = await handler.handle('Test with metadata', metadata);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('text', 'Test with metadata');
    });

    it('should throw on empty text', async () => {
      await expect(handler.handle('')).rejects.toThrow('Text is required');
    });

    it('should handle client errors gracefully', async () => {
      const errorDeps: CaptureHandlerDeps = {
        capture: async () => {
          throw new Error('Network error');
        },
      };
      const errorHandler = new CaptureHandler(errorDeps);
      await expect(errorHandler.handle('Test')).rejects.toThrow('Network error');
    });
  });

  describe('types', () => {
    it('should have correct response structure', async () => {
      const result = await handler.handle('Structure test');
      expect(typeof result.id).toBe('string');
      expect(typeof result.text).toBe('string');
      expect(typeof result.agent_id).toBe('string');
      expect(typeof result.created_at).toBe('string');
    });
  });
});
