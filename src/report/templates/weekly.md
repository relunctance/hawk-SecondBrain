# Weekly Report — {{agent_id}}

> Period: {{week_start}} ~ {{week_end}}
> Generated: {{generated_at}}

## 📊 Weekly Stats

| Metric | Value |
|--------|-------|
| Agent | `{{agent_id}}` |
| Week Start | {{week_start}} |
| Week End | {{week_end}} |
| Total Memories | **{{total_memories}}** |
| Total Captures | {{total_captures}} |
| Total Recalls | {{total_recalls}} |
| Days Tracked | {{daily_count}} |

{{#if daily_breakdown}}
## Daily Breakdown

| Date | Memories | Captures | Recalls |
|------|----------|----------|---------|
{{#each daily_breakdown}}
| {{date}} | {{total_memories}} | {{captures}} | {{recalls}} |
{{/each}}
{{/if}}

## Memory Insights

{{insights}}
