---
type: adr
adr_id: "016"
date: 2025-12-10
status: accepted
date_decided: 2025-12-10
deciders: [linqibin]
technical_debt: none
tags:
  - decision/architecture
  - cqrs
  - commandbus
  - hexagonal-architecture
---

# ADR-016: CQRS 命令侧架构设计

## 状态

**accepted**

## 背景

Patra 项目采用六边形架构 + DDD，写操作（CUD）涉及多个横切关注点：

- 日志记录
- 指标采集
- 分布式追踪
- 事务管理

如果每个 Controller 都自行处理这些关注点，会导致：

1. **代码重复**：每个 Controller 都需要编写相似的日志、指标代码
2. **职责混乱**：Controller 承担过多职责，违反单一职责原则
3. **难以统一**：横切关注点的实现风格不一致

### 设计挑战

| 挑战 | 说明 |
|------|------|
| **统一入口** | 如何为所有写操作提供统一的处理机制？ |
| **横切关注点** | 如何优雅地处理日志、指标、追踪等横切关注点？ |
| **类型安全** | 如何确保 Command 与 Handler 的类型匹配？ |
| **可扩展性** | 如何在不修改现有代码的情况下添加新功能？ |

## 决策

### 1. 采用 CommandBus 模式

**选择**：实现 CommandBus 作为所有写操作的统一入口。

```
Controller → CommandBus → Handler → Repository → Aggregate
```

**对比分析**：

| 方案 | 优点 | 缺点 |
|------|------|------|
| **直接调用 Service** | 简单 | 无法统一处理横切关注点 |
| **AOP 切面** | 无侵入 | 配置复杂，难以精细控制 |
| **CommandBus** | 统一入口，可扩展 | 引入额外抽象层 |

**选择理由**：CommandBus 提供了最佳的平衡点，既能统一处理横切关注点，又保持了良好的可扩展性。

### 2. 每个 Command 对应一个 Handler

**选择**：细粒度 Handler，一个 Command 类型对应一个 Handler。

| 方案 | 类数量 | 职责清晰度 | 可测试性 |
|------|--------|-----------|----------|
| 粗粒度（一个 Service 多方法） | 少 | 低 | 低 |
| **细粒度（一对一）** | 多 | **高** | **高** |

**选择理由**：
- 符合单一职责原则
- 每个 Handler 可独立测试
- 便于定位问题

### 3. 拦截器链处理横切关注点

**选择**：采用责任链模式实现拦截器链。

```
Tracing → Logging → Metrics → Handler
   ↓         ↓         ↓        ↓
   ←─────────←─────────←────────←
```

**内置拦截器**：

| 拦截器                       | Order | 功能        |
| ------------------------- | ----- | --------- |
| TracingCommandInterceptor | 50    | 创建追踪 Span |
| LoggingCommandInterceptor | 100   | 记录执行日志    |
| MetricsCommandInterceptor | 200   | 采集执行指标    |

**Order 设计原则**：
- 追踪在最外层（Order=50），确保 Span 覆盖整个执行周期
- 日志在中间（Order=100），记录开始和结束
- 指标在最内层（Order=200），精确测量 Handler 执行时间

### 4. Command 使用 Record 保证不可变性

**选择**：强制使用 Java Record 实现 Command。

```java
public record CreateUserCommand(
    String name,
    String email
) implements Command<UserId> {
    public CreateUserCommand {
        Objects.requireNonNull(name, "name must not be null");
    }
}
```

**选择理由**：
- 不可变性：Record 天然不可变
- 自动生成：equals/hashCode/toString
- 简洁：减少样板代码
- 构造时校验：在 compact constructor 中校验参数

### 5. Handler 声明事务边界

**选择**：在 Handler 的 `handle()` 方法上声明 `@Transactional`。

```java
@Override
@Transactional
public UserId handle(CreateUserCommand command) {
    // ...
}
```

**选择理由**：
- 事务边界清晰：一个 Command 一个事务
- 符合 CQRS 原则：写操作需要事务保护
- 职责明确：Handler 负责事务，Controller 不关心

### 6. Spring Boot Starter 自动装配

**选择**：通过 `patra-spring-boot-starter-core` 提供自动配置。

**自动装配内容**：
- `SimpleCommandBus`：CommandBus 实现
- 异步执行器：支持 `handleAsync()`
- 内置拦截器：条件装配

**条件装配策略**：
- Logging：默认启用，可通过配置禁用
- Tracing：存在 `ObservationRegistry` 时启用
- Metrics：存在 `MeterRegistry` 时启用

## 组件职责

| 组件 | 层级 | 职责 |
|------|------|------|
| **Command** | Application | 封装写操作输入，不可变 |
| **CommandHandler** | Application | 处理命令，编排业务逻辑 |
| **CommandBus** | Application | 统一入口，路由命令 |
| **CommandInterceptor** | Infrastructure | 横切关注点处理 |

## 数据流

```
Request (Adapter)
    ↓ Controller 转换
Command (Application)
    ↓ CommandBus 分发
    ↓ Interceptor Chain 处理
Handler (Application)
    ↓ Repository 调用
Aggregate (Domain)
    ↓ 持久化
Result → Controller → Response
```

## 后果

### 正面影响

- **统一入口**：所有写操作通过 CommandBus，便于管理和监控
- **横切关注点分离**：日志、指标、追踪通过拦截器处理，Handler 专注业务
- **可扩展性**：新增拦截器无需修改现有代码
- **可测试性**：Handler 可独立单元测试，无需启动 Spring 容器
- **类型安全**：泛型确保 Command 与 Handler 类型匹配

### 负面影响

- **类数量增加**：每个写操作需要 Command + Handler 两个类
- **间接层**：引入 CommandBus 增加了一层抽象

### 风险

- **Handler 重复注册**：同一 Command 类型注册多个 Handler
  - **缓解**：SimpleCommandBus 检测并记录警告

## 相关文档

- [[03-cqrs-command-side|CQRS 命令侧设计]] - 详细设计文档
- [[ADR-017-cqrs-query-side-architecture|ADR-017]] - CQRS 查询侧架构设计
