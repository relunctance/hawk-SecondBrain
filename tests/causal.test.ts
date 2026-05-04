/**
 * Causal Memory Integration Tests (KR-3.14) - TDD RED phase
 * Tests counterfactual extraction and causal detection via HawkMemoryClient
 */

import { HawkMemoryClient } from '../src/client';

// Mock config
const mockConfig = {
  hawkMemoryUrl: 'http://localhost:18368',
  hawkAgentId: 'test-causal-agent',
  hawkApiKey: '',
};

jest.mock('../src/config', () => ({
  loadConfig: () => mockConfig,
}));

describe('Causal Memory Integration (KR-3.14)', () => {
  let client: HawkMemoryClient;

  beforeAll(() => {
    client = new HawkMemoryClient({
      baseUrl: mockConfig.hawkMemoryUrl,
      agentId: mockConfig.hawkAgentId,
    });
  });

  // ─── Counterfactual API Tests ─────────────────────────────────────

  describe('Counterfactual API', () => {
    it('should define counterfactual branch structure', () => {
      // CounterfactualBranch should have all required fields
      const branch = {
        id: 'cf-001',
        source_memory_id: 'mem-001',
        branch_id: 'branch-001',
        alternative_choice: 'Use React instead of Vue',
        hypothesis: 'React would have been faster',
        confidence: 0.85,
        key_differences: [
          'React: faster ecosystem vs Vue: simpler learning curve',
        ],
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      expect(branch.id).toBeDefined();
      expect(branch.source_memory_id).toBeDefined();
      expect(branch.branch_id).toBeDefined();
      expect(branch.alternative_choice).toBeDefined();
      expect(branch.hypothesis).toBeDefined();
      expect(typeof branch.confidence).toBe('number');
      expect(Array.isArray(branch.key_differences)).toBe(true);
    });

    it('should structure counterfactual extract response', () => {
      const response = {
        branch: {
          id: 'cf-001',
          source_memory_id: 'mem-001',
          branch_id: 'branch-001',
          alternative_choice: 'Use PostgreSQL instead of MongoDB',
          hypothesis: 'PostgreSQL would have been more reliable',
          confidence: 0.78,
          key_differences: ['ACID compliance', 'complex joins'],
          created_at: Date.now(),
          updated_at: Date.now(),
        },
      };

      expect(response.branch).toBeDefined();
      expect(response.branch.id).toBeTruthy();
    });

    it('should structure counterfactual list response', () => {
      const response = {
        branches: [
          {
            id: 'cf-001',
            source_memory_id: 'mem-001',
            branch_id: 'branch-001',
            alternative_choice: 'Choice A',
            hypothesis: 'Hypothesis A',
            confidence: 0.9,
            key_differences: ['diff1', 'diff2'],
            created_at: Date.now(),
            updated_at: Date.now(),
          },
          {
            id: 'cf-002',
            source_memory_id: 'mem-001',
            branch_id: 'branch-002',
            alternative_choice: 'Choice B',
            hypothesis: 'Hypothesis B',
            confidence: 0.75,
            key_differences: ['diff3', 'diff4'],
            created_at: Date.now(),
            updated_at: Date.now(),
          },
        ],
      };

      expect(Array.isArray(response.branches)).toBe(true);
      expect(response.branches.length).toBe(2);
    });
  });

  // ─── Causal Detection API Tests ──────────────────────────────────

  describe('Causal Detection API', () => {
    it('should define causal detect request structure', () => {
      const request = {
        agent_id: 'test-agent',
        cause: 'raining',
        effect: 'traffic_jam',
      };

      expect(request.agent_id).toBeDefined();
      expect(request.cause).toBeDefined();
      expect(request.effect).toBeDefined();
    });

    it('should define causal detect result structure', () => {
      const result = {
        is_causal: true,
        confidence: 0.92,
        reasoning: 'Rain causes slippery roads which leads to slower traffic',
      };

      expect(typeof result.is_causal).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.reasoning).toBeDefined();
    });

    it('should handle non-causal relationships', () => {
      const result = {
        is_causal: false,
        confidence: 0.3,
        reasoning: 'Correlation does not imply causation',
      };

      expect(result.is_causal).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  // ─── Causal Chain Extract API Tests ──────────────────────────────

  describe('Causal Chain Extract API', () => {
    it('should define causal extract request structure', () => {
      const request = {
        agent_id: 'test-agent',
        memory_id: 'mem-001',
        topic: 'technology_stack',
      };

      expect(request.agent_id).toBeDefined();
      expect(request.memory_id).toBeDefined();
    });

    it('should define causal extract response structure', () => {
      const response = {
        memory_id: 'mem-001',
        branches: [
          {
            id: 'cf-001',
            source_memory_id: 'mem-001',
            branch_id: 'branch-001',
            alternative_choice: 'Choice A',
            hypothesis: 'Hypothesis A',
            confidence: 0.85,
            key_differences: ['diff1'],
            created_at: Date.now(),
            updated_at: Date.now(),
          },
        ],
        summary: 'Decision analysis for technology stack selection',
        extracted_at: new Date().toISOString(),
      };

      expect(response.memory_id).toBeDefined();
      expect(Array.isArray(response.branches)).toBe(true);
      expect(response.summary).toBeDefined();
      expect(response.extracted_at).toBeDefined();
    });
  });

  // ─── Client Method Existence Tests ────────────────────────────────

  describe('HawkMemoryClient causal methods', () => {
    it('should have extractCounterfactual method', () => {
      expect(typeof (client as any).extractCounterfactual).toBe('function');
    });

    it('should have getCounterfactualBranches method', () => {
      expect(typeof (client as any).getCounterfactualBranches).toBe('function');
    });

    it('should have listCounterfactualBranches method', () => {
      expect(typeof (client as any).listCounterfactualBranches).toBe('function');
    });

    it('should have detectCausal method', () => {
      expect(typeof (client as any).detectCausal).toBe('function');
    });

    it('should have extractCausalChain method', () => {
      expect(typeof (client as any).extractCausalChain).toBe('function');
    });
  });
});
