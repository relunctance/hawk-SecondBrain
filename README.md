# hawk-SecondBrain

> **OpenClaw Hooks Bridge — HTTP API Client for hawk-memory**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)

**hawk-SecondBrain** is the bridge layer between OpenClaw agent hooks and hawk-memory's HTTP API. It transforms local hook handlers into API calls, enabling distributed memory across multiple agents and sessions.

> 📖 This document is also available in [简体中文](README.zh-CN.md).

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
  - [Docker (Recommended)](#docker-recommended)
  - [Bare Metal](#bare-metal)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Development](#development)
- [Memory Features](#memory-features)
- [License](#license)

---

## Overview

hawk-SecondBrain implements the OpenClaw hook interface (`capture`, `recall`, `dream`, and more) by forwarding all operations to the hawk-memory HTTP API server. This enables:

- **Multi-agent memory sharing**: All agents connect to a central hawk-memory server
- **Persistence**: Memory survives agent restarts and machine reboots
- **Scalability**: Decouple compute (hooks) from storage (hawk-memory)
- **Distributed deployment**: Run hawk-memory on a server, hooks on multiple clients

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     OpenClaw Agent                          │
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐ │
│  │  Capture │   │  Recall  │   │   Dream  │   │  Stats │ │
│  │   Hook   │   │   Hook   │   │   Hook   │   │  Hook  │ │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └───┬────┘ │
└───────┼───────────────┼───────────────┼─────────────┼───────┘
        │               │               │             │
        └───────────────┴───────────────┴─────────────┘
                            │
                            ▼ HTTP API (axios)
                            │
                    ┌───────────────┐
                    │ hawk-memory   │
                    │   :18368      │
                    │               │
                    │  LanceDB      │
                    │  xinference   │
                    │  Redis        │
                    │  mflow        │
                    └───────────────┘
```

### Component Responsibilities

| Component | Role |
|-----------|------|
| **hawk-SecondBrain** | OpenClaw hooks → HTTP API bridge (TypeScript) |
| **hawk-memory** | Core memory engine: capture, recall, embedding, storage (Go) |
| **xinference** | Local LLM/embedding inference (bge-m3, qwen2.5) |
| **LanceDB** | Vector database for semantic memory storage |
| **Redis** | Short-term cache and working memory |
| **mflow** | Procedural memory and task flow engine |

---

## Quick Start

### Prerequisites

- Docker + Docker Compose **OR** Node.js 20+ + Go 1.21+
- 8GB RAM minimum (16GB recommended)
- Linux x86_64

### Docker (Recommended)

One-command installation:

```bash
curl -sSL https://raw.githubusercontent.com/relunctance/hawk-SecondBrain/main/scripts/install-docker.sh | bash
```

Or manually:

```bash
# Clone the repository
git clone https://github.com/relunctance/hawk-SecondBrain.git
cd hawk-SecondBrain

# Run the installer
chmod +x scripts/install-docker.sh
./scripts/install-docker.sh
```

After installation, verify with:

```bash
cd ~/.hawk
docker compose up -d

# Run smoke tests
./scripts/smoke-test.sh
```

### Bare Metal

For servers without Docker, use the bare-metal installer:

```bash
curl -sSL https://raw.githubusercontent.com/relunctance/hawk-SecondBrain/main/scripts/install-bare-metal.sh | bash
```

Manual setup:

```bash
# 1. Install dependencies
apt install redis-server golang nodejs npm git

# 2. Build hawk-memory
git clone https://github.com/relunctance/hawk-memory.git ~/repos/hawk-memory
cd ~/repos/hawk-memory
make build-native

# 3. Clone and build hawk-SecondBrain
git clone https://github.com/relunctance/hawk-SecondBrain.git ~/repos/hawk-SecondBrain
cd ~/repos/hawk-SecondBrain
npm install && npm run build

# 4. Start hawk-memory
systemctl --user start hawk-memory
```

---

## API Reference

All API calls are made to the hawk-memory server (default: `http://localhost:18368`).

### Capture Memory

```bash
curl -X POST http://localhost:18368/v1/capture \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Learned that React hooks depend on call order",
    "agent_id": "my-agent",
    "memory_type": "working"
  }'
```

Response:
```json
{
  "id": "mem_abc123",
  "text": "Learned that React hooks depend on call order",
  "agent_id": "my-agent",
  "created_at": "2026-05-04T10:00:00Z",
  "confidence": 0.95
}
```

### Recall Memory

```bash
curl -X POST http://localhost:18368/v1/recall \
  -H "Content-Type: application/json" \
  -d '{
    "query": "React hooks rules",
    "agent_id": "my-agent",
    "top_k": 5
  }'
```

Response:
```json
{
  "memories": [
    {
      "id": "mem_abc123",
      "text": "Learned that React hooks depend on call order",
      "score": 0.94
    }
  ],
  "query": "React hooks rules",
  "total": 1
}
```

### Working Memory

```bash
# List active working memory entries
curl "http://localhost:18368/v1/wm/active?agent_id=my-agent"

# Resume a task
curl -X POST "http://localhost:18368/v1/wm/resume" \
  -d '{"agent_id":"my-agent","task_id":"task_123"}'

# Complete a task
curl -X POST "http://localhost:18368/v1/wm/complete" \
  -d '{"agent_id":"my-agent","task_id":"task_123"}'
```

### Belief Timeline

```bash
# Record a belief
curl -X POST http://localhost:18368/v1/belief \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "my-agent",
    "text": "I think TypeScript improves code quality"
  }'

# Get belief timeline
curl "http://localhost:18368/v1/belief/timeline?agent_id=my-agent"
```

### Memory Hygiene (Coach)

```bash
# Get hygiene report
curl "http://localhost:18368/v1/coach/report?agent_id=my-agent"

# Run hygiene detection
curl -X POST http://localhost:18368/v1/coach/detect \
  -d '{"agent_id":"my-agent"}'
```

### Stats

```bash
# Daily stats
curl "http://localhost:18368/v1/stats/daily?agent_id=my-agent"

# Weekly report (hawk-SecondBrain generates from daily snapshots)
```

For complete API documentation, see [hawk-memory API docs](https://github.com/relunctance/hawk-memory).

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HAWK_MEMORY_URL` | `http://localhost:18368` | hawk-memory server URL |
| `HAWK_MEMORY_API_KEY` | — | API key for authentication |
| `HAWK_AGENT_ID` | `default` | Default agent ID |
| `LOG_LEVEL` | `info` | Log level: debug, info, warn, error |

### hawk-memory config.yaml

```yaml
server:
  host: "0.0.0.0"
  port: 18368

storage:
  lancedb:
    path: "~/.hawk/data/hawk-memory/lancedb"

xai:
  xinference_url: "http://localhost:9997"
  embedding_model: "bge-m3"
  embedding_dim: 1024
  llm_model: "qwen2.5-7b-instruct"

mflow:
  url: "http://localhost:8000"
  dual_write: true

redis:
  url: "redis://localhost:6379"
```

---

## Development

### Project Structure

```
hawk-SecondBrain/
├── src/
│   ├── client.ts         # HawkMemoryClient HTTP wrapper
│   ├── config.ts         # Configuration management
│   ├── types.ts          # TypeScript type definitions
│   ├── hooks/            # Hook implementations
│   │   ├── capture/      # Capture hook
│   │   ├── recall/       # Recall hook
│   │   ├── dream/        # Dream/night consolidation hook
│   │   ├── stats.ts      # Stats collection hook
│   │   ├── til/          # Today I Learned hook
│   │   ├── almost-lost/  # Memory decay detection
│   │   ├── branches/     # Memory branching
│   │   ├── causal/       # Causal memory
│   │   ├── coach/        # Memory hygiene coach
│   │   └── ...
│   ├── report/           # Report generation
│   │   └── weekly-generator.ts
│   ├── skills/           # Skills
│   │   └── daily-summary.ts
│   └── index.ts          # Entry point
├── tests/                # Jest test suites
├── scripts/
│   ├── install-docker.sh      # Docker installer
│   ├── install-bare-metal.sh   # Bare metal installer
│   └── smoke-test.sh           # Smoke test suite
├── config/
├── dist/                 # Compiled JavaScript (generated)
└── package.json
```

### Setup

```bash
# Clone
git clone https://github.com/relunctance/hawk-SecondBrain.git
cd hawk-SecondBrain

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

### Running Tests

```bash
# All tests
npm test

# Specific test file
npx jest tests/hooks/capture.test.ts -v

# With coverage
npm test -- --coverage
```

### Hook Development

Each hook follows the pattern:

```typescript
// src/hooks/<feature>/handler.ts
import { HawkMemoryClient } from '../../client';

export class FeatureHandler {
  constructor(private client: HawkMemoryClient) {}

  async execute(params: FeatureParams): Promise<FeatureResult> {
    // 1. Call hawk-memory API
    const result = await this.client.featureAPI(params);

    // 2. Transform response if needed

    // 3. Return structured result
    return result;
  }
}
```

---

## Memory Features

hawk-SecondBrain exposes 21 memory capabilities through the hawk-memory API:

| # | Feature | Description |
|---|---------|-------------|
| 1 | Working Memory | Short-term task context with resume/complete |
| 2 | Deprecation | Mark outdated information as deprecated |
| 3 | Learning Memory | Extract and store lessons learned |
| 4 | Confidence Calibration | Track confidence signals over time |
| 5 | Memory Chronology | Maintain temporal ordering of events |
| 6 | Belief Timeline | Track beliefs and their evolution |
| 7 | TIL (Today I Learned) | Structured learning capture |
| 8 | Almost Lost | Detect decaying memories at risk of loss |
| 9 | Memory Branching | Create experimental memory branches |
| 10 | Task-Aware Recall | Context-sensitive memory retrieval |
| 11 | Self-Awareness | Track what the agent knows/doesn't know |
| 12 | Memory Prediction | Predict future memory needs |
| 13 | Memory Coach | Hygiene and memory health coaching |
| 14 | Causal Memory | Store cause-effect relationships |
| 15 | Active Memory | High-urgency, high-importance memories |
| 16 | Consensus Memory | Cross-agent shared knowledge |
| 17 | Counterfactual Memory | What-if scenario exploration |
| 18 | Metacognitive Monitor | Monitor memory access patterns |
| 19 | Memory Hygiene Score | Quantify memory ecosystem health |
| 20 | Strategic Memory | Long-term goal and plan storage |
| 21 | Implicit Knowledge | Tacit knowledge extraction |

---

## Deployment Options

### Docker Compose (All-in-One)

```yaml
services:
  hawk-memory:
    image: ghcr.io/relunctance/hawk-memory:v0.1.0
    ports:
      - "18368:18368"
    volumes:
      - hawk-data:/data/hawk-memory

  xinference:
    image: xprobe/xinference:v0.16.0
    ports:
      - "9997:9997"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

  hawk-secondbrain:
    build: .
    ports:
      - "3000:3000"
    environment:
      - HAWK_MEMORY_URL=http://hawk-memory:18368
```

### Kubernetes

Helm charts available at `charts/hawk-secondbrain/`.

---

## Troubleshooting

### hawk-memory not responding

```bash
# Check if service is running
curl http://localhost:18368/health

# Check logs
journalctl --user -u hawk-memory -n 50

# Restart
systemctl --user restart hawk-memory
```

### Capture succeeds but recall returns empty

```bash
# Wait for FTS index to build (usually 3-5 seconds after capture)
sleep 5
curl -X POST http://localhost:18368/v1/recall -d '{"query":"your query","agent_id":"test"}'
```

### xinference model not loaded

```bash
# Check xinference status
curl http://localhost:9997/v1/models

# If empty, launch models via UI at http://localhost:8080
# or API:
curl -X POST http://localhost:9997/v1/models \
  -d '{"model_name":"bge-m3","model_type":"embedding"}'
```

---

## License

Apache License 2.0 — see [LICENSE](LICENSE) for details.

---

## Links

- [中文文档](README.zh-CN.md) — 简体中文版
- [hawk-memory](https://github.com/relunctance/hawk-memory) — Core memory engine
- [hawk-eval](https://github.com/relunctance/hawk-eval) — Benchmark system
- [hawk-sla](https://github.com/relunctance/hawk-sla) — Project tracking
- [OpenClaw](https://github.com/relunctance/openclaw) — Agent framework
