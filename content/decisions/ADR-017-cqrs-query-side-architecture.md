---
type: adr
adr_id: "017"
date: 2025-12-10
status: accepted
date_decided: 2025-12-10
deciders: [linqibin]
technical_debt: none
tags:
  - decision/architecture
  - cqrs
  - hexagonal-architecture
  - query
---

# ADR-017: CQRS 查询侧架构设计

## 状态

**accepted**

## 背景

Patra 项目已实现 CommandBus 处理写操作（Command Side），采用以下流程：

```
Controller → CommandBus → CommandHandler → Repository(Domain) → Adapter(Infra)
```

但读操作（Query Side）的设计尚未确定。业界存在多种 CQRS 查询侧实现方案：

| 方案 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| **QueryBus + QueryHandler** | 与 CommandBus 对称，每个查询一个 Handler | 一致性好 | 类爆炸严重 |
| **Thin Read Layer** | 查询直接访问数据库，绕过 Domain | 简单高效 | 破坏架构一致性 |
| **QueryService + QueryPort** | 粗粒度 Port，Service 直接调用 | 平衡灵活与一致性 | 无统一分发机制 |

### 设计挑战

1. **架构一致性**：是否让查询也走 Domain Port？
2. **类爆炸风险**：细粒度 QueryHandler 会导致大量类
3. **依赖约束**：如何防止开发人员绕过 Domain 直接访问 Infrastructure？
4. **查询优化**：查询通常需要跨表连接、聚合统计，如何支持？

## 决策

### 1. 查询必须通过 Domain Port

**选择**：不绕过 Domain，查询仍走 Domain Port。

| 考量 | 绕过 Domain | 走 Domain Port |
|------|------------|----------------|
| **架构一致性** | ❌ 读写架构不一致 | ✅ 统一模式 |
| **依赖约束** | ❌ 打开绕过口子，难以管控 | ✅ 强制通过 Port |
| **团队规范** | ❌ 容易产生混乱 | ✅ 规则清晰 |
| **可测试性** | ❌ 难以 mock | ✅ 接口易于测试 |

**关键理由**：如果允许 Adapter 直接访问 Infra，开发人员可能在任何地方绕过 Domain 直接写数据库，这将破坏整个六边形架构的完整性。

### 2. 采用粗粒度 QueryPort

**选择**：一个聚合对应一个 QueryPort，Port 内包含该聚合相关的所有查询方法。

**类数量对比**（假设 3 个聚合，每聚合 5 个查询场景）：

| 方案 | 类/接口数量 |
|------|-------------|
| 细粒度（每查询一个 Port） | 3 × 5 × 4 = **60 个** |
| 粗粒度（每聚合一个 Port） | 3 × 4 = **12 个** |

### 3. View 对象定义在 Domain 层

**选择**：View 定义在 Domain 层。

| 放置位置 | 分析 |
|----------|------|
| Infra 层 | ❌ 破坏依赖方向，App 层无法使用 |
| App 层 | ❌ Infra 只依赖 Domain，无法返回 App 层的类型 |
| Adapter 层 | ❌ 同上，且暴露协议细节 |
| **Domain 层** | ✅ 所有层都可以使用，不暴露实现细节 |

**View vs 聚合根**：

| 维度 | 聚合根 | View |
|------|--------|------|
| **用途** | 业务逻辑载体 | 展示数据载体 |
| **结构** | 完整的领域模型 | 扁平的数据结构 |
| **行为** | 包含业务方法 | 无行为（纯数据） |
| **可变性** | 可变 | 不可变（record） |
| **暴露范围** | 内部使用 | 内部使用，不对外暴露 |

### 4. ACL 边界转换

**选择**：Adapter 层必须进行 ACL（Anti-Corruption Layer）转换。

```
外部 → Request DTO → [Controller] → 内部 DTO/Command
内部 View → [ResponseConverter] → Response DTO → 外部
```

**命名规范**：
- 请求：以 `*Request` 结尾（如 `ArticleQueryRequest`）
- 响应：以 `*Response` 结尾（如 `ArticleDetailResponse`）
- View：以 `*View` 结尾（如 `ArticleDetailView`），仅内部使用

**关键原则**：Controller 绝不直接返回 View 对象，必须通过 Converter 转换为 Response。

### 5. 暂不引入 QueryBus

**选择**：当前阶段使用 QueryService 直接调用 QueryPort，不引入 QueryBus。

| 考量 | CommandBus | QueryBus |
|------|-----------|----------|
| **事务管理** | ✅ 需要统一事务边界 | ❌ 通常只读，不需要 |
| **拦截器需求** | ✅ 日志、审计、验证 | ⚠️ 需求较少 |
| **复杂度收益** | 值得引入 | 过度设计 |

**扩展预留**：如需统一的缓存、权限拦截器，可在不改变现有代码的前提下引入 QueryBus。

## 组件职责

| 组件 | 层级 | 职责 |
|------|------|------|
| **QueryPort** | Domain (Port) | 定义查询契约，返回 View 对象 |
| **View** | Domain | 查询返回的只读数据结构，内部使用 |
| **QueryAdapter** | Infra | 实现 QueryPort，可跨表连接、使用视图 |
| **QueryService** | Application | 编排读操作，使用只读事务 |
| **Controller** | Adapter | 接收 Request，调用 Service，返回 Response |
| **ResponseConverter** | Adapter | ACL 转换：View → Response |

## 数据流

```
Client
  ↓ Request
Controller (Adapter)
  ↓ 调用
QueryService (Application)
  ↓ 调用
QueryPort (Domain Port) ←── QueryAdapter (Infra) 实现
  ↓                              ↓
View (Domain)                 Database
  ↓ 返回
ResponseConverter (Adapter)
  ↓ 转换
Response → Client
```

## 依赖约束

```
Adapter → Application → Domain ← Infrastructure
                ↓
        [禁止] Adapter → Infrastructure
```

通过 Maven 模块依赖管理强制执行，Adapter 模块没有对 Infra 模块的依赖，编译时即报错。

## 后果

### 正面影响

- **架构一致性**：读写操作统一通过 Domain Port，依赖方向清晰
- **防止绕过**：Maven 依赖约束确保无法绕过 Domain 直接访问 Infra
- **类数量可控**：粗粒度 QueryPort 避免类爆炸
- **边界清晰**：ACL 转换确保内部对象不泄露到外部
- **可测试性**：QueryPort 接口易于 mock 测试

### 负面影响

- **间接层增加**：查询需要经过 QueryPort、QueryAdapter、ResponseConverter
- **View 与 Response 冗余**：两者结构可能高度相似，存在一定冗余

### 风险

- **Converter 遗漏**：开发人员可能忘记转换直接返回 View
  - **缓解**：代码审查清单明确检查项，后续可引入 ArchUnit 自动检测

## 相关文档

- [[04-cqrs-query-side|CQRS 查询侧设计]] - 详细设计文档
- [[ADR-016-cqrs-command-side-architecture|ADR-016]] - CQRS 命令侧架构设计
