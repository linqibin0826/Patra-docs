---
title: 基础设施设计
type: moc
updated: 2025-12-10
---

# 基础设施设计

> 基础设施设计文档涵盖项目的基础架构配置，包括端口分配、网络拓扑、容器编排、持久化策略等。

## 文档索引

| 文档 | 说明 | 状态 |
|------|------|------|
| [[01-port-allocation\|端口分配规范]] | 全局端口管理、网络拓扑图 | completed |
| [[02-aggregate-persistence\|聚合根持久化设计]] | 三层事件模型、增量更新策略 | completed |
| [[03-cqrs-command-side\|CQRS 命令侧设计]] | CommandBus、Handler、拦截器链 | completed |
| [[04-cqrs-query-side\|CQRS 查询侧设计]] | QueryPort、View 对象、查询架构 | completed |

## 按状态

### 草稿

```dataview
TABLE date as "创建日期"
FROM "designs/infrastructure"
WHERE type = "design" AND status = "draft"
SORT date DESC
```

### 已完成

```dataview
TABLE date as "创建日期"
FROM "designs/infrastructure"
WHERE type = "design" AND status = "completed"
SORT date DESC
```

## 相关资源

- [[../observability/_MOC|可观测性设计]] - 监控、追踪、日志
- [[../../decisions/_MOC|ADR 索引]] - 架构决策记录
