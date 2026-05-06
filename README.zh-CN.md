# hawk-SecondBrain

> **OpenClaw Hooks 桥接层 — hawk-memory HTTP API 客户端**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)

**hawk-SecondBrain** 是 OpenClaw Agent Hooks 与 hawk-memory HTTP API 之间的桥接层。它将本地 Hook 处理器转换为 API 调用，支持多 Agent 和多会话场景下的分布式记忆共享。

> 📖 This document is also available in [English](README.md).

---

## 目录

- [概述](#概述)
- [架构](#架构)
- [快速开始](#快速开始)
  - [Docker（推荐）](#docker推荐)
  - [Bare Metal](#bare-metal)
- [API 参考](#api-参考)
- [配置](#配置)
- [开发](#开发)
- [记忆功能](#记忆功能)
- [许可证](#许可证)

---

## 概述

hawk-SecondBrain 通过将所有操作转发到 hawk-memory HTTP API 服务器来实现 OpenClaw Hook 接口（`capture`、`recall`、`dream` 等）。这实现了：

- **多 Agent 记忆共享**：所有 Agent 连接到一个中心 hawk-memory 服务器
- **持久化**：记忆在 Agent 重启和机器重启后仍然保留
- **可扩展性**：将计算（Hooks）与存储（hawk-memory）解耦
- **分布式部署**：在服务器上运行 hawk-memory，在多个客户端上运行 Hooks

---

## 架构

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

### 组件职责

| 组件 | 职责 |
|-----------|------|
| **hawk-SecondBrain** | OpenClaw Hooks → HTTP API 桥接（TypeScript） |
| **hawk-memory** | 核心记忆引擎：capture、recall、embedding、storage（Go） |
| **xinference** | 本地 LLM/embedding 推理（bge-m3、qwen2.5） |
| **LanceDB** | 用于语义记忆存储的向量数据库 |
| **Redis** | 短期缓存和工作记忆 |
| **mflow** | 程序记忆和任务流引擎 |

---

## 快速开始

### 前置条件

- Docker + Docker Compose **或** Node.js 20+ + Go 1.21+
- 最少 8GB RAM（推荐 16GB）
- Linux x86_64

### Docker（推荐）

一键安装：

```bash
curl -sSL https://raw.githubusercontent.com/relunctance/hawk-SecondBrain/main/scripts/install-docker.sh | bash
```

或手动：

```bash
# 克隆仓库
git clone https://github.com/relunctance/hawk-SecondBrain.git
cd hawk-SecondBrain

# 运行安装脚本
chmod +x scripts/install-docker.sh
./scripts/install-docker.sh
```

安装后验证：

```bash
cd ~/.hawk
docker compose up -d

# 运行冒烟测试
./scripts/smoke-test.sh
```

### Bare Metal

在没有 Docker 的服务器上，使用裸机安装脚本：

```bash
curl -sSL https://raw.githubusercontent.com/relunctance/hawk-SecondBrain/main/scripts/install-bare-metal.sh | bash
```

手动安装：

```bash
# 1. 安装依赖
apt install redis-server golang nodejs npm git

# 2. 构建 hawk-memory
git clone https://github.com/relunctance/hawk-memory.git ~/repos/hawk-memory
cd ~/repos/hawk-memory
make build-native

# 3. 克隆并构建 hawk-SecondBrain
git clone https://github.com/relunctance/hawk-SecondBrain.git ~/repos/hawk-SecondBrain
cd ~/repos/hawk-SecondBrain
npm install && npm run build

# 4. 启动 hawk-memory
systemctl --user start hawk-memory
```

---

## API 参考

所有 API 调用都发送到 hawk-memory 服务器（默认：`http://localhost:18368`）。

### 捕获记忆

```bash
curl -X POST http://localhost:18368/v1/capture \
  -H "Content-Type: application/json" \
  -d '{
    "text": "学到 React Hooks 依赖调用顺序",
    "agent_id": "my-agent",
    "memory_type": "working"
  }'
```

响应：
```json
{
  "id": "mem_abc123",
  "text": "学到 React Hooks 依赖调用顺序",
  "agent_id": "my-agent",
  "created_at": "2026-05-04T10:00:00Z",
  "confidence": 0.95
}
```

### 召回记忆

```bash
curl -X POST http://localhost:18368/v1/recall \
  -H "Content-Type: application/json" \
  -d '{
    "query": "React hooks 规则",
    "agent_id": "my-agent",
    "top_k": 5
  }'
```

响应：
```json
{
  "memories": [
    {
      "id": "mem_abc123",
      "text": "学到 React Hooks 依赖调用顺序",
      "score": 0.94
    }
  ],
  "query": "React hooks 规则",
  "total": 1
}
```

### 工作记忆

```bash
# 列出活跃的工作记忆条目
curl "http://localhost:18368/v1/wm/active?agent_id=my-agent"

# 恢复任务
curl -X POST "http://localhost:18368/v1/wm/resume" \
  -d '{"agent_id":"my-agent","task_id":"task_123"}'

# 完成任务
curl -X POST "http://localhost:18368/v1/wm/complete" \
  -d '{"agent_id":"my-agent","task_id":"task_123"}'
```

### 信念时间线

```bash
# 记录信念
curl -X POST http://localhost:18368/v1/belief \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "my-agent",
    "text": "我认为 TypeScript 提高了代码质量"
  }'

# 获取信念时间线
curl "http://localhost:18368/v1/belief/timeline?agent_id=my-agent"
```

### 记忆卫生（Coach）

```bash
# 获取卫生报告
curl "http://localhost:18368/v1/coach/report?agent_id=my-agent"

# 运行卫生检测
curl -X POST http://localhost:18368/v1/coach/detect \
  -d '{"agent_id":"my-agent"}'
```

### 统计

```bash
# 每日统计
curl "http://localhost:18368/v1/stats/daily?agent_id=my-agent"

# 周报（hawk-SecondBrain 从每日快照生成）
```

完整的 API 文档请参阅 [hawk-memory API 文档](https://github.com/relunctance/hawk-memory)。

---

## 配置

### 环境变量

| 变量 | 默认值 | 描述 |
|----------|---------|-------------|
| `HAWK_MEMORY_URL` | `http://localhost:18368` | hawk-memory 服务器地址 |
| `HAWK_MEMORY_API_KEY` | — | 认证 API 密钥 |
| `HAWK_AGENT_ID` | `default` | 默认 Agent ID |
| `LOG_LEVEL` | `info` | 日志级别：debug、info、warn、error |

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

## 开发

### 项目结构

```
hawk-SecondBrain/
├── src/
│   ├── client.ts         # HawkMemoryClient HTTP 封装
│   ├── config.ts         # 配置管理
│   ├── types.ts          # TypeScript 类型定义
│   ├── hooks/            # Hook 实现
│   │   ├── capture/      # Capture Hook
│   │   ├── recall/       # Recall Hook
│   │   ├── dream/        # Dream/夜间整理 Hook
│   │   ├── stats.ts      # 统计收集 Hook
│   │   ├── til/          # 今天学到了什么 Hook
│   │   ├── almost-lost/  # 记忆衰减检测
│   │   ├── branches/     # 记忆分支
│   │   ├── causal/      # 因果记忆
│   │   ├── coach/       # 记忆卫生教练
│   │   └── ...
│   ├── report/           # 报告生成
│   │   └── weekly-generator.ts
│   ├── skills/           # 技能
│   │   └── daily-summary.ts
│   └── index.ts          # 入口文件
├── tests/                # Jest 测试套件
├── scripts/
│   ├── install-docker.sh      # Docker 安装脚本
│   ├── install-bare-metal.sh   # 裸机安装脚本
│   └── smoke-test.sh           # 冒烟测试套件
├── config/
├── dist/                 # 编译后的 JavaScript（自动生成）
└── package.json
```

### 设置

```bash
# 克隆
git clone https://github.com/relunctance/hawk-SecondBrain.git
cd hawk-SecondBrain

# 安装依赖
npm install

# 构建
npm run build

# 运行测试
npm test
```

### 运行测试

```bash
# 所有测试
npm test

# 特定测试文件
npx jest tests/hooks/capture.test.ts -v

# 带覆盖率
npm test -- --coverage
```

### Hook 开发

每个 Hook 遵循以下模式：

```typescript
// src/hooks/<feature>/handler.ts
import { HawkMemoryClient } from '../../client';

export class FeatureHandler {
  constructor(private client: HawkMemoryClient) {}

  async execute(params: FeatureParams): Promise<FeatureResult> {
    // 1. 调用 hawk-memory API
    const result = await this.client.featureAPI(params);

    // 2. 按需转换响应

    // 3. 返回结构化结果
    return result;
  }
}
```

---

## 记忆功能

hawk-SecondBrain 通过 hawk-memory API 暴露 21 种记忆能力：

| # | 功能 | 描述 |
|---|---------|-------------|
| 1 | 工作记忆 | 短期任务上下文，支持暂停/恢复 |
| 2 | 废弃标记 | 将过时信息标记为已废弃 |
| 3 | 学习记忆 | 提取并存储经验教训 |
| 4 | 置信度校准 | 跟踪随时间变化的置信度信号 |
| 5 | 记忆时序 | 维护事件的时间顺序 |
| 6 | 信念时间线 | 跟踪信念及其演变 |
| 7 | TIL（今天学到了） | 结构化学习捕获 |
| 8 | 差点丢失 | 检测濒临丢失的衰减记忆 |
| 9 | 记忆分支 | 创建实验性记忆分支 |
| 10 | 任务感知召回 | 上下文敏感的记忆检索 |
| 11 | 自我感知 | 跟踪 Agent 知道/不知道的内容 |
| 12 | 记忆预测 | 预测未来记忆需求 |
| 13 | 记忆教练 | 卫生和记忆健康指导 |
| 14 | 因果记忆 | 存储因果关系 |
| 15 | 活跃记忆 | 高优先级、高重要性的记忆 |
| 16 | 共识记忆 | 跨 Agent 共享知识 |
| 17 | 反事实记忆 | 如果...会怎么样的探索 |
| 18 | 元认知监控 | 监控记忆访问模式 |
| 19 | 记忆卫生评分 | 量化记忆生态系统健康度 |
| 20 | 战略记忆 | 长期目标和计划存储 |
| 21 | 隐性知识 | 隐性知识提取 |

---

## 部署选项

### Docker Compose（一体化）

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

Helm charts 可在 `charts/hawk-secondbrain/` 获取。

---

## 故障排除

### hawk-memory 无响应

```bash
# 检查服务是否运行
curl http://localhost:18368/health

# 检查日志
journalctl --user -u hawk-memory -n 50

# 重启
systemctl --user restart hawk-memory
```

### Capture 成功但 Recall 返回空

```bash
# 等待 FTS 索引构建（通常在 capture 后 3-5 秒）
sleep 5
curl -X POST http://localhost:18368/v1/recall -d '{"query":"your query","agent_id":"test"}'
```

### xinference 模型未加载

```bash
# 检查 xinference 状态
curl http://localhost:9997/v1/models

# 如果为空，通过 UI 在 http://localhost:8080 启动模型
# 或通过 API：
curl -X POST http://localhost:9997/v1/models \
  -d '{"model_name":"bge-m3","model_type":"embedding"}'
```

---

## 许可证

Apache License 2.0 — 详见 [LICENSE](LICENSE)。

---

## 链接

- [English Documentation](README.md) — English version
- [hawk-memory](https://github.com/relunctance/hawk-memory) — 核心记忆引擎
- [hawk-eval](https://github.com/relunctance/hawk-eval) — 基准测试系统
- [hawk-sla](https://github.com/relunctance/hawk-sla) — 项目跟踪
- [OpenClaw](https://github.com/relunctance/openclaw) — Agent 框架
