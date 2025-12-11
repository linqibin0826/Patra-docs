---
title: CQRS 查询侧设计
type: design
status: completed
date: 2025-12-10
module: infrastructure
tags: [design/infrastructure, cqrs, query, hexagonal-architecture, read-model]
---

# CQRS 查询侧设计

> 本文档定义 Patra 项目中 CQRS（命令查询职责分离）模式的查询侧（Query Side）架构设计，在保持六边形架构完整性的前提下，提供高效、可维护的读操作实现。

---

## 背景与问题

### 现状

Patra 项目已实现 CommandBus 处理写操作（Command Side），采用以下流程：

```
Controller → CommandBus → CommandHandler → Repository(Domain) → Adapter(Infra)
```

但读操作（Query Side）的设计尚未确定。

### 设计挑战

| 挑战        | 说明                                              |
| --------- | ----------------------------------------------- |
| **架构一致性** | 查询是否需要与命令一样走完整的 Domain Port？                    |
| **类爆炸风险** | 每个查询都需要 Query + Handler + Port + Adapter 会导致大量类 |
| **依赖约束**  | 如何防止开发人员绕过 Domain 直接访问 Infrastructure？          |
| **查询优化**  | 查询通常需要跨表连接、聚合统计，如何支持？                           |

### 设计目标

1. **架构一致性**：读写操作都通过 Domain Port，保持统一的依赖方向
2. **防止绕过**：通过 Maven 模块依赖约束，确保 Adapter 无法直接访问 Infra
3. **避免类爆炸**：采用粗粒度 QueryPort，一个聚合对应一个 Port
4. **查询优化**：支持跨表连接、反范式查询，返回展示优化的 View 对象

---

## 设计决策

### 决策 1：查询必须通过 Domain Port

**背景**：业界部分 CQRS 实践建议查询侧可以绕过 Domain 层直接访问数据库，理由是查询不涉及业务规则。

**我们的选择**：**不绕过，查询仍走 Domain Port**

| 考量 | 绕过 Domain | 走 Domain Port |
|------|------------|----------------|
| **架构一致性** | ❌ 读写架构不一致 | ✅ 统一模式 |
| **依赖约束** | ❌ 打开绕过口子，难以管控 | ✅ 强制通过 Port |
| **团队规范** | ❌ 容易产生混乱 | ✅ 规则清晰 |
| **可测试性** | ❌ 难以 mock | ✅ 接口易于测试 |

**关键考量**：如果允许 Adapter 直接访问 Infra，开发人员可能在任何地方绕过 Domain 直接写数据库，这将破坏整个架构的完整性。

### 决策 2：采用粗粒度 QueryPort

**背景**：如果每个查询都定义独立的 Port，会导致类爆炸。

**我们的选择**：**一个聚合对应一个 QueryPort**，Port 内包含该聚合相关的所有查询方法。

**类数量对比**（假设 3 个聚合，每聚合 5 个查询场景）：

| 方案 | 类/接口数量 |
|------|-------------|
| 细粒度（每查询一个 Port） | 3 × 5 × 4 = **60 个** |
| 粗粒度（每聚合一个 Port） | 3 × 4 = **12 个** |

### 决策 3：View 对象定义在 Domain 层

**背景**：查询返回的数据结构（View）应该放在哪一层？

**我们的选择**：**View 定义在 Domain 层**

| 放置位置         | 分析                               |
| ------------ | -------------------------------- |
| Infra 层      | ❌ 破坏依赖方向，App 层无法使用               |
| App 层        | ❌ Infra 只依赖 Domain，无法返回 App 层的类型 |
| Adapter 层    | ❌ 同上，且暴露协议细节                     |
| **Domain 层** | ✅ 所有层都可以使用，不暴露实现细节               |

**View vs 聚合根**：

| 维度 | 聚合根 | View |
|------|--------|------|
| **用途** | 业务逻辑载体 | 展示数据载体 |
| **结构** | 完整的领域模型 | 扁平的数据结构 |
| **行为** | 包含业务方法 | 无行为（纯数据） |
| **可变性** | 可变 | 不可变（record） |

### 决策 4：暂不引入 QueryBus

**背景**：是否需要与 CommandBus 对称的 QueryBus？

**我们的选择**：**当前阶段不引入，使用 QueryService 直接调用 QueryPort**

| 考量 | CommandBus | QueryBus |
|------|-----------|----------|
| **事务管理** | ✅ 需要统一事务边界 | ❌ 通常只读，不需要 |
| **拦截器需求** | ✅ 日志、审计、验证 | ⚠️ 需求较少 |
| **复杂度收益** | 值得引入 | 过度设计 |

**后续扩展**：如需统一的缓存、权限拦截器，可在不改变现有代码的前提下引入 QueryBus。

---

## 核心设计

### 架构总览

```d2
direction: down

adapter: Adapter {
  style.fill: "#E3F2FD"
  style.stroke: "#1976D2"
  controller: Controller
}

application: Application {
  style.fill: "#E8F5E9"
  style.stroke: "#388E3C"
  command_handler: CommandHandler
  query_service: QueryService
}

domain: Domain {
  style.fill: "#FFF3E0"
  style.stroke: "#F57C00"
  repository: Repository {
    shape: hexagon
  }
  query_port: QueryPort {
    shape: hexagon
  }
  view: View {
    shape: class
  }
  aggregate: Aggregate {
    shape: class
  }
}

infra: Infrastructure {
  style.fill: "#FCE4EC"
  style.stroke: "#C2185B"
  repo_adapter: RepositoryAdapter
  query_adapter: QueryAdapter
  db: Database {
    shape: cylinder
  }
}

adapter.controller -> application.command_handler: CommandBus
adapter.controller -> application.query_service: Direct

application.command_handler -> domain.repository
application.query_service -> domain.query_port

domain.repository -> domain.aggregate: returns
domain.query_port -> domain.view: returns

infra.repo_adapter -> domain.repository: implements
infra.query_adapter -> domain.query_port: implements
infra.repo_adapter -> infra.db
infra.query_adapter -> infra.db
```

### 写操作 vs 读操作对比

```d2
direction: right

command: Command Side {
  style.fill: "#FFEBEE"
  style.stroke: "#D32F2F"
  c1: Controller
  c2: CommandBus
  c3: Handler
  c4: Repository {shape: hexagon}
  c5: Adapter
  c6: Aggregate {shape: class}

  c1 -> c2 -> c3 -> c4 -> c5
  c4 -> c6: operates
}

query: Query Side {
  style.fill: "#E3F2FD"
  style.stroke: "#1976D2"
  q1: Controller
  q2: QueryService
  q3: QueryPort {shape: hexagon}
  q4: QueryAdapter
  q5: View {shape: class}

  q1 -> q2 -> q3 -> q4
  q3 -> q5: returns
}
```

### 组件职责

| 组件 | 层级 | 职责 |
|------|------|------|
| **Repository** | Domain (Port) | 聚合根持久化、重建，返回领域对象 |
| **QueryPort** | Domain (Port) | 定义查询契约，返回 View 对象 |
| **View** | Domain | 查询返回的只读数据结构，内部使用，不对外暴露 |
| **RepositoryAdapter** | Infra | 实现 Repository，操作聚合根对应的表 |
| **QueryAdapter** | Infra | 实现 QueryPort，可跨表连接、使用视图 |
| **CommandHandler** | Application | 编排写操作，管理事务 |
| **QueryService** | Application | 编排读操作，使用只读事务 |
| **Controller** | Adapter | 接收 Request，调用 Service，返回 Response |
| **ResponseConverter** | Adapter | ACL 转换：View → Response |
| **Request** | Adapter | 外部请求 DTO，以 `*Request` 结尾 |
| **Response** | Adapter | 外部响应 DTO，以 `*Response` 结尾 |

---

## 数据流转

### 查询执行时序

```d2
shape: sequence_diagram

client: Client
controller: Controller
converter: ResponseConverter
service: QueryService
port: QueryPort
query_adapter: QueryAdapter
db: Database

client -> controller: "1. GET /articles/123"
controller -> service: "2. getDetail(123)"
service -> port: "3. findDetailById(123)"
port -> query_adapter: "4. DI injection"
query_adapter -> db: "5. SELECT ... JOIN ..."
db -> query_adapter: "6. ResultSet"
query_adapter -> port: "7. View"
port -> service: "8. View"
service -> controller: "9. View"
controller -> converter: "10. toResponse(view)"
converter -> controller: "11. Response"
controller -> client: "12. JSON Response"
```

### Repository vs QueryPort 的区别

```d2
direction: right

repository: Repository (Write) {
  style.fill: "#FFEBEE"
  style.stroke: "#D32F2F"
  input: Input
  output: Aggregate Root
  input -> output
}

query_port: QueryPort (Read) {
  style.fill: "#E3F2FD"
  style.stroke: "#1976D2"
  input: Input
  output: View Object
  input -> output
}
```

---

## 目录结构

```
patra-{service}-domain/
└── src/main/java/com/patra/{service}/domain/
    ├── model/                          # 聚合根、实体、值对象
    │   └── article/
    │       └── Article.java
    ├── port/
    │   ├── repository/                 # 写操作端口
    │   │   └── ArticleRepository.java
    │   └── query/                      # 读操作端口
    │       └── ArticleQueryPort.java
    └── view/                           # View 对象
        └── article/
            ├── ArticleDetailView.java
            ├── ArticleListView.java
            └── ArticleSummaryView.java

patra-{service}-app/
└── src/main/java/com/patra/{service}/app/
    └── usecase/
        └── article/
            ├── command/                # 写操作
            │   ├── CreateArticleCommand.java
            │   └── CreateArticleHandler.java
            └── query/                  # 读操作
                └── ArticleQueryService.java

patra-{service}-infra/
└── src/main/java/com/patra/{service}/infra/
    └── adapter/
        ├── persistence/                # Repository 实现
        │   └── ArticleRepositoryAdapter.java
        └── query/                      # QueryPort 实现
            ├── ArticleQueryAdapter.java
            └── mapper/
                └── ArticleQueryMapper.java

patra-{service}-adapter/
└── src/main/java/com/patra/{service}/adapter/
    └── rest/
        ├── ArticleController.java
        ├── request/                      # 请求 DTO
        │   └── ArticleQueryRequest.java
        ├── response/                     # 响应 DTO
        │   ├── ArticleDetailResponse.java
        │   └── ArticleListResponse.java
        └── converter/                    # ACL 转换器
            └── ArticleResponseConverter.java
```

---

## 依赖约束

### 依赖约束与防绕过机制

```d2
direction: down

boot: patra-xxx-boot {
  style.fill: "#E8EAF6"
  style.stroke: "#3F51B5"
}

adapter: patra-xxx-adapter {
  style.fill: "#E3F2FD"
  style.stroke: "#1976D2"
}

app: patra-xxx-app {
  style.fill: "#E8F5E9"
  style.stroke: "#388E3C"
}

domain: patra-xxx-domain {
  style.fill: "#FFF3E0"
  style.stroke: "#F57C00"
}

infra: patra-xxx-infra {
  style.fill: "#FCE4EC"
  style.stroke: "#C2185B"
}

boot -> adapter: includes
boot -> infra: includes

adapter -> app: depends {
  style.stroke: "#4CAF50"
}
app -> domain: depends {
  style.stroke: "#4CAF50"
}
infra -> domain: depends {
  style.stroke: "#4CAF50"
}
adapter -> infra: forbidden {
  style.stroke: "#F44336"
  style.stroke-dash: 5
}
```

**关键约束**：
- Adapter **只依赖** Application，**不能直接依赖** Infra
- Infra **只依赖** Domain，**不能依赖** Application 或 Adapter
- 通过 Maven 依赖管理强制执行，开发人员无法绕过
- Boot 模块在运行时聚合所有层，Spring DI 自动注入 Port 的实现

---

## 开发规范

### 命名约定

| 组件 | 命名规则 | 示例 |
|------|---------|------|
| QueryPort | `{Entity}QueryPort` | `ArticleQueryPort` |
| QueryAdapter | `{Entity}QueryAdapter` | `ArticleQueryAdapter` |
| QueryMapper | `{Entity}QueryMapper` | `ArticleQueryMapper` |
| QueryService | `{Entity}QueryService` | `ArticleQueryService` |
| View 对象 | `{Entity}{Purpose}View` | `ArticleDetailView` |
| Request DTO | `{Entity}{Action}Request` | `ArticleQueryRequest` |
| Response DTO | `{Entity}{Purpose}Response` | `ArticleDetailResponse` |
| Converter | `{Entity}ResponseConverter` | `ArticleResponseConverter` |

### 设计原则

| 原则 | 说明 |
|------|------|
| **View 在 Domain 层** | 确保 Infra 可以返回，内部使用不对外暴露 |
| **QueryPort 粗粒度** | 一个聚合对应一个 Port，包含所有相关查询 |
| **查询不修改状态** | QueryPort 的所有方法都是只读的 |
| **View 使用 record** | 保证不可变性 |
| **ACL 边界转换** | Request → 内部 DTO，View → Response |
| **禁止暴露内部对象** | Controller 不返回 View，必须转换为 Response |

### 代码审查清单

- [ ] View 是否定义在 Domain 层的 `view/` 包？
- [ ] QueryPort 是否只包含读操作？
- [ ] QueryService 是否使用 `@Transactional(readOnly = true)`？
- [ ] Controller 是否通过 Converter 将 View 转换为 Response？
- [ ] Request/Response 是否以正确后缀命名？
- [ ] 查询 SQL 是否优化（索引、连接方式）？

---

## 性能优化

### 查询优化建议

| 优化手段 | 说明 |
|----------|------|
| **数据库视图** | 复杂查询可创建视图，简化 SQL |
| **适当反范式** | View 可包含冗余数据，减少连表次数 |
| **分页限制** | QueryService 限制单页最大数量 |
| **索引优化** | 为常用查询条件创建复合索引 |
| **只读事务** | 使用 `readOnly = true` 优化事务 |

### 后续扩展：QueryBus

如需统一的缓存、权限、审计拦截器，可引入 QueryBus：

```
当前：Controller → QueryService → QueryPort
未来：Controller → QueryBus → QueryHandler → QueryPort
                      │
                 拦截器链（缓存、权限、日志）
```

引入 QueryBus 时，只需在 QueryService 和 QueryPort 之间增加一层，不影响现有的 QueryPort 和 QueryAdapter。

---

## 与 CommandBus 对比

| 维度 | CommandBus（写） | QueryService（读） |
|------|-----------------|-------------------|
| **入口** | CommandBus 统一分发 | QueryService 直接调用 |
| **Handler** | 每个 Command 一个 Handler | 不需要独立 Handler |
| **Port** | Repository（按聚合根设计） | QueryPort（按聚合粗粒度） |
| **返回** | Result / void | View 对象 |
| **事务** | @Transactional | @Transactional(readOnly) |
| **拦截器** | 支持（日志、验证、追踪） | 暂不支持（后续可加） |

---

## 文件清单

| 文件 | 模块 | 说明 |
|------|------|------|
| `{Entity}QueryPort.java` | domain | 查询端口接口 |
| `{Entity}*View.java` | domain | View 对象（record），内部使用 |
| `{Entity}QueryAdapter.java` | infra | QueryPort 实现 |
| `{Entity}QueryMapper.java` | infra | MyBatis Mapper 接口 |
| `{Entity}QueryMapper.xml` | infra | SQL 映射文件 |
| `{Entity}QueryService.java` | app | 查询编排服务 |
| `{Entity}Controller.java` | adapter | REST 控制器 |
| `{Entity}*Request.java` | adapter | 请求 DTO，外部入参 |
| `{Entity}*Response.java` | adapter | 响应 DTO，外部返回 |
| `{Entity}ResponseConverter.java` | adapter | ACL：View → Response 转换器 |

---

## 变更日志

| 日期 | 变更内容 |
|------|----------|
| 2025-12-10 | 初始版本：CQRS 查询侧架构设计 |
