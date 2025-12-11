---
title: CQRS 命令侧设计
type: design
status: completed
date: 2025-12-10
module: infrastructure
tags: [design/infrastructure, cqrs, command, commandbus, hexagonal-architecture]
---

# CQRS 命令侧设计

> 本文档定义 Patra 项目中 CQRS（命令查询职责分离）模式的命令侧（Command Side）架构设计，提供统一的写操作处理机制。

---

## 背景与问题

### 现状分析

在六边形架构中，写操作（CUD）涉及多个横切关注点：
- 日志记录
- 指标采集
- 分布式追踪
- 事务管理
- 输入验证

如果每个 Controller 都自行处理这些关注点，会导致代码重复和职责混乱。

### 设计目标

1. **统一入口**：所有写操作通过 CommandBus 分发
2. **职责分离**：每个命令对应一个独立的 Handler
3. **可扩展性**：通过拦截器链支持横切关注点
4. **可观测性**：内置日志、指标、追踪支持
5. **类型安全**：利用泛型确保 Command 与 Handler 的类型匹配

---

## 核心设计

### 架构总览

```d2
direction: down

adapter: Adapter {
  style.fill: "#E3F2FD"
  style.stroke: "#1976D2"
  controller: Controller
  request: Request
  response: Response
}

bus: CommandBus {
  style.fill: "#E8F5E9"
  style.stroke: "#388E3C"
  interceptors: Interceptor Chain {
    tracing: Tracing
    logging: Logging
    metrics: Metrics
  }
}

application: Application {
  style.fill: "#FFF3E0"
  style.stroke: "#F57C00"
  handler: CommandHandler
  command: Command
}

domain: Domain {
  style.fill: "#FCE4EC"
  style.stroke: "#C2185B"
  repository: Repository {
    shape: hexagon
  }
  aggregate: Aggregate {
    shape: class
  }
}

adapter.controller -> bus: dispatch
bus -> bus.interceptors
bus.interceptors -> application.handler
application.handler -> domain.repository
domain.repository -> domain.aggregate: operates
```

### 执行流程

```d2
shape: sequence_diagram

client: Client
controller: Controller
bus: CommandBus
tracing: TracingInterceptor
logging: LoggingInterceptor
metrics: MetricsInterceptor
handler: CommandHandler
repo: Repository

client -> controller: "1. HTTP POST /users"
controller -> bus: "2. handle(CreateUserCommand)"
bus -> tracing: "3. intercept()"
tracing -> logging: "4. intercept()"
logging -> metrics: "5. intercept()"
metrics -> handler: "6. handle()"
handler -> repo: "7. save(aggregate)"
repo -> handler: "8. result"
handler -> metrics: "9. return"
metrics -> logging: "10. return"
logging -> tracing: "11. return"
tracing -> bus: "12. return"
bus -> controller: "13. result"
controller -> client: "14. Response"
```

### 组件职责

| 组件 | 层级 | 职责 |
|------|------|------|
| **Command** | Application | 命令对象，封装写操作的输入参数，不可变 |
| **CommandHandler** | Application | 处理命令，编排业务逻辑，管理事务 |
| **CommandBus** | Application | 统一入口，路由命令到对应 Handler |
| **CommandInterceptor** | Infrastructure | 拦截器，处理横切关注点（日志、指标、追踪） |
| **Controller** | Adapter | 接收 Request，构造 Command，返回 Response |

---

## 核心接口

### Command 接口

```java
/// 命令标记接口，泛型参数 R 表示返回类型
public interface Command<R> {
}
```

**设计原则**：
- 使用 Java Record 实现，确保不可变性
- 在构造器中进行参数校验
- 命名以动词开头，如 `CreateUserCommand`、`UpdateArticleCommand`

### CommandHandler 接口

```java
/// 每个 Command 对应一个唯一的 Handler
public interface CommandHandler<C extends Command<R>, R> {
    R handle(C command);
}
```

**设计原则**：
- 单一职责：一个 Handler 只处理一种 Command
- 无状态：Handler 不持有可变状态，支持并发
- 事务管理：使用 `@Transactional` 声明事务边界

### CommandBus 接口

```java
public interface CommandBus {
    /// 同步处理命令
    <R> R handle(Command<R> command);

    /// 异步处理命令
    <R> CompletableFuture<R> handleAsync(Command<R> command);
}
```

### CommandInterceptor 接口

```java
public interface CommandInterceptor {
    <R> R intercept(Command<R> command, CommandExecutor<R> next);

    @FunctionalInterface
    interface CommandExecutor<R> {
        R execute(Command<R> command);
    }
}
```

**执行顺序**：按 `@Order` 值从小到大排列，形成洋葱模型

```
Order=50  Tracing   ─┐
Order=100 Logging   ─┼─► Handler ─┼─► Logging ─► Tracing
Order=200 Metrics   ─┘            └─► Metrics
```

---

## Spring Boot Starter 实现

### 自动配置

```d2
direction: right

starter: patra-spring-boot-starter-core {
  style.fill: "#E8EAF6"
  style.stroke: "#3F51B5"

  auto_config: CommandBusAutoConfiguration
  props: CommandBusProperties
  bus_impl: SimpleCommandBus

  interceptors: interceptors {
    tracing: TracingCommandInterceptor
    logging: LoggingCommandInterceptor
    metrics: MetricsCommandInterceptor
  }
}

common: patra-common-core {
  style.fill: "#FFF3E0"
  style.stroke: "#F57C00"

  command: Command
  handler: CommandHandler
  bus: CommandBus
  interceptor: CommandInterceptor
}

starter -> common: implements
```

### 内置拦截器

| 拦截器 | Order | 功能 | 条件装配 |
|--------|-------|------|----------|
| **TracingCommandInterceptor** | 50 | 创建追踪 Span | 存在 `ObservationRegistry` |
| **LoggingCommandInterceptor** | 100 | 记录执行日志 | 默认启用 |
| **MetricsCommandInterceptor** | 200 | 采集执行指标 | 存在 `MeterRegistry` |

### 配置项

```yaml
patra:
  command-bus:
    async:
      core-pool-size: 4
      max-pool-size: 16
      queue-capacity: 100
      thread-name-prefix: "cmd-async-"
    interceptors:
      logging: true    # 默认启用
      tracing: true    # 需要 ObservationRegistry
      metrics: true    # 需要 MeterRegistry
```

---

## 目录结构

```
patra-common/patra-common-core/
└── src/main/java/com/patra/common/cqrs/
    ├── Command.java                  # 命令接口
    ├── CommandHandler.java           # 处理器接口
    ├── CommandBus.java               # 总线接口
    ├── CommandInterceptor.java       # 拦截器接口
    ├── CommandHandlerNotFoundException.java
    └── package-info.java

patra-spring-boot-starter-core/
└── src/main/java/com/patra/starter/core/cqrs/
    ├── SimpleCommandBus.java         # 总线实现
    ├── CommandBusAutoConfiguration.java
    ├── CommandBusProperties.java
    └── interceptor/
        ├── CommandInterceptorAutoConfiguration.java
        ├── LoggingCommandInterceptor.java
        ├── MetricsCommandInterceptor.java
        └── TracingCommandInterceptor.java

patra-{service}-app/
└── src/main/java/com/patra/{service}/app/usecase/
    └── {entity}/
        └── command/
            ├── Create{Entity}Command.java
            └── Create{Entity}Handler.java
```

---

## 使用示例

### 定义 Command

```java
public record CreateArticleCommand(
    String title,
    String content,
    Long authorId
) implements Command<ArticleId> {

    public CreateArticleCommand {
        Assert.notBlank(title, "标题不能为空");
        Assert.notNull(authorId, "作者ID不能为空");
    }
}
```

### 实现 Handler

```java
@Component
public class CreateArticleHandler
        implements CommandHandler<CreateArticleCommand, ArticleId> {

    private final ArticleRepository articleRepository;

    @Override
    @Transactional
    public ArticleId handle(CreateArticleCommand cmd) {
        Article article = Article.create(
            cmd.title(),
            cmd.content(),
            cmd.authorId()
        );
        return articleRepository.save(article).getId();
    }
}
```

### Controller 调用

```java
@RestController
@RequestMapping("/articles")
public class ArticleController {

    private final CommandBus commandBus;

    @PostMapping
    public ArticleResponse create(@RequestBody CreateArticleRequest request) {
        ArticleId id = commandBus.handle(new CreateArticleCommand(
            request.title(),
            request.content(),
            request.authorId()
        ));
        return new ArticleResponse(id.getValue());
    }
}
```

---

## 开发规范

### 命名约定

| 组件 | 命名规则 | 示例 |
|------|---------|------|
| Command | `{Action}{Entity}Command` | `CreateArticleCommand` |
| Handler | `{Action}{Entity}Handler` | `CreateArticleHandler` |
| Request | `{Action}{Entity}Request` | `CreateArticleRequest` |
| Response | `{Entity}{Purpose}Response` | `ArticleDetailResponse` |

### 设计原则

| 原则 | 说明 |
|------|------|
| **Command 不可变** | 使用 Java Record，构造时校验参数 |
| **Handler 无状态** | 不持有可变字段，支持并发调用 |
| **单一职责** | 一个 Handler 只处理一种 Command |
| **事务边界** | Handler 的 `handle()` 方法声明 `@Transactional` |
| **ACL 转换** | Controller 负责 Request → Command、Result → Response |

### 代码审查清单

- [ ] Command 是否使用 Record 并在构造器中校验？
- [ ] Handler 是否标注 `@Component` 和 `@Transactional`？
- [ ] Handler 是否无状态（无可变字段）？
- [ ] Controller 是否通过 CommandBus 调用而非直接调用 Handler？
- [ ] Request/Response 命名是否符合规范？

---

## 与 QueryService 对比

| 维度 | CommandBus（写） | QueryService（读） |
|------|-----------------|-------------------|
| **入口** | CommandBus 统一分发 | QueryService 直接调用 |
| **粒度** | 细（每命令一个 Handler） | 粗（每聚合一个 Port） |
| **返回** | Result / void | View 对象 |
| **事务** | @Transactional | @Transactional(readOnly) |
| **拦截器** | 支持（日志、追踪、指标） | 暂不支持 |

---

## 文件清单

| 文件 | 模块 | 说明 |
|------|------|------|
| `Command.java` | common-core | 命令标记接口 |
| `CommandHandler.java` | common-core | 处理器接口 |
| `CommandBus.java` | common-core | 总线接口 |
| `CommandInterceptor.java` | common-core | 拦截器接口 |
| `SimpleCommandBus.java` | starter-core | 总线 Spring 实现 |
| `*CommandInterceptor.java` | starter-core | 内置拦截器 |
| `{Action}{Entity}Command.java` | app | 命令对象 |
| `{Action}{Entity}Handler.java` | app | 命令处理器 |

---

## 变更日志

| 日期 | 变更内容 |
|------|----------|
| 2025-12-10 | 初始版本：CQRS 命令侧架构设计 |
