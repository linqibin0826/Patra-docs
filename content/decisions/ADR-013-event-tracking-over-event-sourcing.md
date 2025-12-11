---
type: adr
adr_id: "013"
date: 2025-12-08
status: accepted
date_decided: 2025-12-08
deciders: [Qibin Lin]
technical_debt: none
tags:
  - decision/architecture
  - ddd
  - aggregate
  - persistence
---

# ADR-013: 聚合根持久化采用事件追踪而非事件溯源

## 状态

**accepted**

## 背景

在 DDD 六边形架构中，聚合根通常包含多个子实体和值对象集合。当聚合根被修改后，需要将变更高效地持久化到数据库。

当前项目使用"全删全增"策略，存在以下问题：

1. **性能差**：每次保存都删除所有子实体再重新插入
2. **ID 不稳定**：删除重建导致 ID 变化，影响外键关联和审计
3. **触发不必要的级联**：DELETE 可能触发外键约束检查

为解决这些问题，我们评估了两种主流方案：

| 方案 | 说明 |
|------|------|
| **事件追踪** | 业务方法记录变更事件，Repository 据此生成增量 SQL |
| **事件溯源** | 用事件作为唯一数据来源，状态由事件重放计算 |

## 决策

我们将采用**事件追踪（Event Tracking）**方案，而非事件溯源（Event Sourcing）。

具体实现：
- 聚合根字段更新使用**脏标记**（`markDirty()`）
- 子实体集合增删改使用**变更事件**（`trackChildAdded/Updated/Removed()`）
- Repository 根据脏标记和变更事件生成精确的 INSERT/UPDATE/DELETE SQL

## 后果

### 正面影响

1. **实现简单**：纯 Java 实现，无需事件存储、快照、投影等基础设施
2. **与现有架构兼容**：继续使用 MyBatis-Plus + 传统表结构，无迁移成本
3. **性能提升**：只执行实际需要的 SQL，避免全删全增
4. **调试友好**：变更事件清晰可追溯，比 Snapshot Diff 更易理解
5. **团队熟悉度**：传统 CRUD 思维，学习成本低

### 负面影响

1. **无历史回溯**：无法查看聚合根的历史状态
2. **无审计追踪**：变更事件持久化后丢弃，不保留变更历史
3. **开发者责任**：需要在每个修改方法中手动调用追踪方法，可能遗漏

### 风险

1. **变更遗漏**：开发者忘记调用 `markDirty()` 或 `trackChildXxx()` 导致数据不同步
   - **缓解措施**：代码审查 Checklist、单元测试覆盖

## 替代方案

### 方案 A：事件溯源（Event Sourcing）

**优点**：
- 完整的变更历史，可回溯到任意时间点
- 天然的审计日志
- 支持时间旅行查询
- 事件驱动架构的基础

**缺点**：
- 实现复杂度高，需要事件存储、快照机制、投影视图
- 与现有 MyBatis-Plus 架构不兼容，需要大规模重构
- 查询需要重放事件或维护投影，增加复杂度
- 团队无事件溯源经验，学习成本高

**不采用原因**：项目目标是解决"全删全增"的性能问题，不需要历史回溯能力。引入事件溯源会带来过度设计。

### 方案 B：Snapshot Diff（快照对比）

**优点**：
- 对业务代码透明，无需手动追踪变更
- 可使用 JaVers 等成熟库

**缺点**：
- 每次保存需要 O(n) 对象图比较
- 依赖 equals/hashCode 正确实现
- 深层嵌套对象 diff 复杂
- 难以追踪哪个操作导致了变更
- 引入框架依赖，与"Domain 层纯 Java"原则冲突

**不采用原因**：性能开销和框架依赖不符合项目原则。

## 参考资料

- [[designs/infrastructure/02-aggregate-persistence|聚合根持久化设计文档]]
- Martin Fowler: [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- Vaughn Vernon: Implementing Domain-Driven Design, Chapter 8
