# hawk-SecondBrain

> 🧠 给 AI 装上第二个大脑 —— 基于 hawk-memory 的记忆进化层

## 定位

**不是存储系统，是记忆进化系统。**

底层连接 `hawk-memory`（Python HTTP API），在上层封装衰减、晋升、遗忘提醒等行为逻辑，让 AI 的记忆像人类一样：**越重要的越深刻，越常用的越牢固，长期不用的会模糊。**

## 核心能力

### 1. 记忆衰减（Decay）
- 每次召回记忆时，系统自动记录 `last_accessed`
- 超过 `decay_threshold` 天未访问的记忆，重要性自动降级
- 降级时写入 `metadata.decay_level`（0=新鲜, 3=即将遗忘）

### 2. 遗忘前提醒（Before-Forget Alert）
- 检测到 `decay_level=3` 的记忆，在遗忘前 N 天主动提醒用户
- 提醒触发方式：写入专属 metadata 字段，由上层（Hermes/OpenClaw）消费

### 3. 重要性晋升（Promotion）
- 被频繁访问的记忆（hot memory）自动晋升 importance 等级
- 晋升阈值可配置（默认：7天内访问≥5次）

### 4. 跨 Agent 共享（Hermes 集成）
- 记忆按 `agent_id` 隔离，同时支持 `shared=true` 的跨 Agent 共享
- Hermes 作为中转层，读写共享记忆

## 连接 hawk-memory

**Base URL**（默认）：
```
http://localhost:8080
```

**接口映射**：

| hawk-SecondBrain 操作 | hawk-memory API |
|---|---|
| 写入记忆 | `POST /api/memory` |
| 召回记忆 | `GET /api/memory/:id` |
| 搜索记忆 | `POST /api/memory/search` |
| 标记已读（触发decay） | `PATCH /api/memory/:id` |
| 删除记忆 | `DELETE /api/memory/:id` |

## 配置项

```json
{
  "hawk_memory_base_url": "http://localhost:8080",
  "decay_threshold_days": 30,
  "forget_warning_days": 3,
  "promotion_access_threshold": 5,
  "promotion_access_window_days": 7
}
```

## 与 OpenClaw / Hermes 的关系

```
OpenClaw (main agent)
  └── hawk-SecondBrain skill
        └── hawk-memory (Python HTTP API)
              └── LanceDB

Hermes (team agent)
  └── hawk-SecondBrain skill
        └── hawk-memory (共享记忆池)
```

- **OpenClaw**：个人记忆层，读写自己 agent_id 下的记忆
- **Hermes**：团队记忆层，读写 shared=true 的共享记忆，并协调晋升/衰减逻辑

## 文件结构

```
hawk-SecondBrain/
  SKILL.md              ← 你在这里
  DECAY.md              ← 衰减算法设计
  PROMOTION.md          ← 晋升规则设计
  examples/             ← 使用示例
    basic.go / basic.py
```

## Roadmap

- [ ] **v0.1**：Python skill 封装 hawk-memory HTTP API（decay/promotion 逻辑）
- [ ] **v0.2**：遗忘前提醒触发机制
- [ ] **v0.3**：Hermes 共享记忆同步协议
- [ ] **v1.0**：完整闭环，跨 Agent 记忆进化

---

_Last updated: 2026-05-03_
