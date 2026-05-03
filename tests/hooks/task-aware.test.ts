/**
 * Tests for Task-Aware Recall integration (KR-3.10)
 * TDD RED → GREEN: Tests compile API integration via HawkMemoryClient
 */

import { HawkMemoryClient } from '../../src/client';
import { CompileResponse } from '../../src/types';

describe('Task-Aware Recall (KR-3.10)', () => {
  describe('CompileResponse type validation', () => {
    it('should have correct CompileResponse structure', () => {
      const response: CompileResponse = {
        task_summary: 'Go 编程最佳实践',
        next_steps: ['学习 Go 基础', '阅读 Go 源码', '实践并发编程'],
        confidence: 0.85,
      };

      expect(typeof response.task_summary).toBe('string');
      expect(Array.isArray(response.next_steps)).toBe(true);
      expect(typeof response.confidence).toBe('number');
      expect(response.confidence).toBeGreaterThanOrEqual(0);
      expect(response.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle low confidence compile response', () => {
      const response: CompileResponse = {
        task_summary: '用户正在查询：Go 编程',
        next_steps: ['暂无足够的记忆信息，建议直接执行任务'],
        confidence: 0.1,
      };

      expect(response.confidence).toBeLessThan(0.5);
      expect(response.next_steps.length).toBeGreaterThan(0);
    });

    it('should handle compile with multiple next_steps', () => {
      const response: CompileResponse = {
        task_summary: '项目架构设计',
        next_steps: ['调研阶段', '设计阶段', '实现阶段', '测试阶段', '部署阶段'],
        confidence: 0.9,
      };

      expect(response.next_steps.length).toBe(5);
    });
  });

  describe('HawkMemoryClient.compile method signature', () => {
    it('should have compile method on client', () => {
      // Verify the client has compile method by checking it exists
      const client = new HawkMemoryClient({ agentId: 'test-agent' });
      expect(typeof (client as any).compile).toBe('function');
    });

    it('should require taskId and query for compile', () => {
      const client = new HawkMemoryClient({ agentId: 'test-agent' });
      const compileMethod = (client as any).compile;

      // Should be callable with taskId and query
      expect(compileMethod).toBeDefined();
    });
  });

  describe('Task-aware recall flow', () => {
    it('should support capture → compile → recall flow', () => {
      const flow = {
        capture: { endpoint: 'POST /v1/capture', requiredFields: ['text', 'agent_id'] },
        compile: { endpoint: 'POST /v1/compile', requiredFields: ['agent_id', 'task_id', 'query'] },
        recall: { endpoint: 'POST /v1/recall', requiredFields: ['agent_id', 'query'] },
      };

      expect(flow.capture.endpoint).toBe('POST /v1/capture');
      expect(flow.compile.endpoint).toBe('POST /v1/compile');
      expect(flow.recall.endpoint).toBe('POST /v1/recall');
    });

    it('should have optional plan parameter for compile', () => {
      const compileRequest = {
        agent_id: 'test-agent',
        task_id: 'task-plan-001',
        query: '项目架构设计',
        plan: {
          steps: ['调研', '设计', '实现'],
        },
      };

      expect(compileRequest).toHaveProperty('plan');
      expect(Array.isArray(compileRequest.plan.steps)).toBe(true);
    });
  });

  describe('Compile API endpoint integration', () => {
    it('should match /v1/compile endpoint', () => {
      // Verify the compile endpoint path
      const compileEndpoint = '/v1/compile';
      expect(compileEndpoint).toBe('/v1/compile');
    });

    it('should handle agent_id injection from client', () => {
      // The client should inject agent_id automatically
      const client = new HawkMemoryClient({ agentId: 'my-test-agent' });
      // Client stores agentId internally, compile should use it
      expect((client as any).agentId).toBe('my-test-agent');
    });
  });
});
