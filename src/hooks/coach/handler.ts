/**
 * Coach Hook Handler (KR-3.13)
 *
 * Integrates with hawk-memory Coach API for memory hygiene management:
 * - GET /v1/coach/report - hygiene report
 * - GET /v1/coach/stats - coach statistics
 * - POST /v1/coach/detect - trigger detection
 */

import { HawkMemoryClient } from '../../client';
import { CoachHygieneReport, CoachStats, CoachIssue } from '../../types';

export interface CoachHandlerDeps {
  client: HawkMemoryClient;
}

export class CoachHandler {
  private client: HawkMemoryClient;

  constructor(deps: CoachHandlerDeps) {
    this.client = deps.client;
  }

  /**
   * Get hygiene report for the agent
   */
  async getHygieneReport(): Promise<CoachHygieneReport> {
    return this.client.getCoachReport();
  }

  /**
   * Get coach statistics for the agent
   */
  async getStats(): Promise<CoachStats> {
    return this.client.getCoachStats();
  }

  /**
   * Trigger a coach detection check
   */
  async runDetection(detectors?: string[]): Promise<{ issues: CoachIssue[]; issues_found: number }> {
    const resp = await this.client.runCoachCheck({ detectors });
    return {
      issues: resp.issues,
      issues_found: resp.issues_found,
    };
  }

  /**
   * Format hygiene report as markdown
   */
  formatReport(report: CoachHygieneReport): string {
    const lines = [
      '# 🧠 Memory Coach - Hygiene Report',
      '',
      `**Agent**: ${report.agent_id}`,
      `**Generated**: ${new Date(report.generated_at).toLocaleString()}`,
      `**Hygiene Score**: ${report.hygiene_score}/100`,
      '',
    ];

    if (report.issues.length === 0) {
      lines.push('✅ No issues detected. Your memory is healthy!');
      return lines.join('\n');
    }

    lines.push('## Issues Found');
    for (const issue of report.issues) {
      const emoji = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
      lines.push(`${emoji} **[${issue.severity.toUpperCase()}]** ${issue.type}`);
      lines.push(`   - Memory: ${issue.memory_id}`);
      lines.push(`   - ${issue.description}`);
      lines.push('');
    }

    lines.push('## Summary');
    lines.push(`- 🔴 High: ${report.summary.high}`);
    lines.push(`- 🟡 Medium: ${report.summary.medium}`);
    lines.push(`- 🟢 Low: ${report.summary.low}`);

    return lines.join('\n');
  }
}
