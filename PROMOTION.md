# Promotion Algorithm

## 晋升模型

记忆被频繁访问 → 重要性自动提升 → 衰减变慢 → 长期保留。

## 晋升触发条件

| 条件 | 默认值 |
|---|---|
| 时间窗口 | 7 天内 |
| 最低访问次数 | ≥ 5 次 |
| 当前 importance | < 1.0（满分不晋升） |

**同时满足时**：importance += 0.1（最高 1.0）

## 晋升检测时机

**每次记忆被访问时**（PATCH /api/memory/:id）：
1. 记录访问时间到 `access_history`
2. 窗口内访问次数 ≥ 5 → 触发晋升
3. 晋升后重置 `access_history`

## Access History 结构

hawk-memory 的 `metadata` 字段：

```json
{
  "access_history": [
    {"at": "2026-05-01T10:00:00Z"},
    {"at": "2026-05-03T14:30:00Z"}
  ]
}
```

## 热记忆识别

当 `access_history.length >= promotion_access_threshold` 在窗口内时：

```python
def is_hot_memory(access_history: list, window_days=7, threshold=5) -> bool:
    cutoff = now - timedelta(days=window_days)
    recent = [a for a in access_history if a['at'] > cutoff]
    return len(recent) >= threshold
```

## 降级（Demotion）

**自动降级**：超过 30 天无访问 → importance -= 0.05（最低 0.0）

**手动降级**：用户显式标记"不再重要" → 直接设为 0.0，触发快速衰减

---

## Promotion vs Decay 关系

```
Promotion ←→ Decay
   ↑           ↓
 访问频繁    长期不访问
   
 最终平衡点：
 - 常访问 → importance → 1.0 → 衰减极慢（接近永久）
 - 不访问 → decay_level → 4 → 软删除候选
```

## 配置项

```json
{
  "promotion_access_threshold": 5,
  "promotion_access_window_days": 7,
  "promotion_increment": 0.1,
  "demotion_threshold_days": 30,
  "demotion_decrement": 0.05
}
```
