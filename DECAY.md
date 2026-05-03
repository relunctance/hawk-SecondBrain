# Decay Algorithm

## 衰减模型

基于 Bruce Squires 的 Weibull Decay 改进：**不需要预设 decay_date，而是根据访问频率自动推断。**

## 核心公式

```
importance_decay = e^(-λt)
λ = base_rate × context_multiplier × access_multiplier
```

**参数说明**：

| 符号 | 含义 | 默认值 |
|---|---|---|
| `t` | 距上次访问的天数 | — |
| `λ` | 衰减率 | 0.05/天 |
| `base_rate` | 基础衰减率 | 0.05 |
| `context_multiplier` | 上下文衰减倍数（硬编码记忆低衰减） | 0.3 |
| `access_multiplier` | 访问频率调整（越常用越难衰减） | 动态 |

## Decay Level 划分

| Level | 名称 | 计算方式 |
|---|---|---|
| 0 | 新鲜 | 创建 < 7 天 |
| 1 | 活跃 | 7-30 天未访问 |
| 2 | 沉睡 | 30-60 天未访问 |
| 3 | 即将遗忘 | 60-90 天未访问 |
| 4 | 已遗忘 | ≥ 90 天未访问（软删除候选） |

## Decay 检测时机

**每次 Search/Capture 操作后**：扫描返回结果的 decay_level，写入 `metadata.decay_level`

**后台 cron**（可选）：每日扫描全量记忆，更新 decay_level

## 遗忘前提醒

当 `decay_level = 3` 且距今 ≥ `forget_warning_days`（默认 3 天）时：

1. 在记忆的 `metadata.warning_flag = true`
2. 提醒消息写入 `hawk-memory` 的 metadata 或专用 field
3. 由 OpenClaw/Hermes 读取并呈现给用户

---

## 实现伪代码

```python
def compute_decay_level(last_accessed: datetime, created_at: datetime, importance: float) -> int:
    days_since_access = (now - last_accessed).days
    days_since_created = (now - created_at).days
    
    if days_since_created < 7:
        return 0
    
    # 硬编码记忆（importance=1.0）衰减减慢
    context_mult = 0.3 if importance >= 1.0 else 1.0
    
    if days_since_access * context_mult < 30:
        return 1
    elif days_since_access * context_mult < 60:
        return 2
    elif days_since_access * context_mult < 90:
        return 3
    else:
        return 4
```
