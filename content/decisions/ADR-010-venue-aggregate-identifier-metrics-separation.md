---
type: adr
adr_id: "010"
date: 2025-12-02
status: accepted
date_decided: 2025-12-02
deciders: [linqibin]
technical_debt: none
tags:
  - decision/architecture
  - domain/catalog
  - ddd/aggregate
---

# ADR-010: Venue 聚合重构 - 分离标识符和年度指标为独立实体

## 状态

**accepted**

## 背景

在 patra-catalog 服务的 Venue（载体/期刊）聚合设计中，面临以下挑战：

1. **多源数据融合**：Venue 数据来自多个来源（OpenAlex、PubMed、Crossref 等），每个来源使用不同的标识符体系（ISSN、OpenAlex ID、NLM ID、MAG ID 等）
2. **标识符多值性**：单个 Venue 可能拥有多个同类型标识符（如 Print ISSN 和 Electronic ISSN）
3. **时序指标需求**：需要跟踪 Venue 的年度发表量、被引量等指标，支持时序分析
4. **原设计局限**：原 `VenueAggregate` 仅包含 `IssnInfo` 值对象，无法满足多源标识符和时序指标需求

## 决策

我们将 Venue 聚合重构为包含两个聚合内实体：

### 1. VenueIdentifier（载体标识符实体）

```java
public class VenueIdentifier implements Serializable {
    private Long id;
    private VenueIdentifierType type;  // 枚举：ISSN, OPENALEX, NLM, MAG, FATCAT, WIKIDATA
    private String value;
    private boolean isPrimary;         // 是否为该类型的首选标识符
}
```

**设计要点**：
- 与 Venue 具有相同生命周期（聚合内实体）
- 支持 ISSN 格式验证（`\d{4}-\d{3}[\dXx]`）
- 每种类型可设置一个首选标识符

### 2. VenueMetrics（载体年度指标实体）

```java
public class VenueMetrics implements Serializable {
    private Long id;
    private int year;           // 统计年份（1900-2100）
    private int worksCount;     // 该年发表作品数
    private int citedByCount;   // 该年被引次数
    private Integer oaWorksCount; // OA 作品数（可选）
}
```

**设计要点**：
- 每年一条记录，支持时序分析
- 提供计算方法：`getAverageCitations()`、`getOaRatio()`
- 年份唯一性约束（同一 Venue 每年只能有一条记录）

### 3. VenueAggregate 结构

```java
public class VenueAggregate extends BaseAggregateRoot<Long> {
    // 基本信息
    private VenueType venueType;
    private String displayName;
    // ... 其他字段

    // 聚合内实体集合
    private Set<VenueIdentifier> identifiers = new HashSet<>();
    private Set<VenueMetrics> yearlyMetrics = new HashSet<>();

    // 标识符管理方法
    public void addIdentifier(VenueIdentifierType type, String value, boolean isPrimary);
    public void removeIdentifier(VenueIdentifierType type, String value);
    public void setPrimaryIdentifier(VenueIdentifierType type, String value);

    // 指标管理方法
    public void addMetrics(VenueMetrics metrics);
    public Optional<VenueMetrics> getMetrics(int year);
}
```

### 4. Repository 接口设计

Repository 接口以聚合根为操作单位，保持 DDD 一致性边界：

```java
public interface VenueRepository {
    /// 检查是否存在任何 Venue 数据（用于一次性初始化检查）。
    boolean hasAnyData();

    /// 批量插入 Venue 聚合根（包含标识符和年度指标子实体）。
    void insertAll(List<VenueAggregate> aggregates);
}
```

**设计演进说明**（2025-12-05）：

原设计使用内部 Record DTO 模式（`VenueData`、`VenueIdentifierData`、`VenueMetricsData`）分离领域对象与持久化。
在实际使用中发现该模式过度设计，增加了不必要的复杂度：

1. **DTO 转换冗余**：Aggregate → DTO → DO 的双重转换
2. **职责分散**：主表和子表的保存逻辑分散在调用方
3. **一致性风险**：调用方需要协调多个保存方法的调用顺序

重构后采用聚合根级别操作，由 Repository 实现内部处理子表持久化，符合 DDD 聚合一致性边界原则。

## 后果

### 正面影响

- **多源融合**：支持来自不同数据源的标识符统一管理，便于数据去重和关联
- **时序分析**：年度指标独立存储，支持载体影响力的时间维度分析
- **扩展性**：新增标识符类型只需扩展枚举，无需修改聚合结构
- **DDD 合规**：聚合内实体设计符合 DDD 战术模式

### 负面影响

- **复杂度增加**：聚合内部结构更复杂，需要管理实体集合
- **持久化复杂**：需要维护三张表（venue、venue_identifier、venue_metrics）

### 风险

- **性能考量**：大量标识符或指标可能影响加载性能，需要考虑延迟加载策略

## 替代方案

### 方案 A：扁平化设计（不采用）

将所有标识符作为 Venue 的直接字段（如 `issn`、`openalexId`、`nlmId` 等）。

**优点**：简单直接，查询性能好

**缺点**：
- 无法支持多值标识符
- 新增标识符类型需要修改表结构
- 无法表达"首选标识符"语义

### 方案 B：JSON 字段存储（不采用）

使用 JSON 字段存储标识符和指标。

**优点**：灵活，无需额外表

**缺点**：
- 无法建立索引，查询性能差
- 无法保证数据一致性
- 不符合关系型数据库范式

## 参考资料

- [OpenAlex Sources API](https://docs.openalex.org/api-entities/sources)
- [DDD 聚合设计原则](https://martinfowler.com/bliki/DDD_Aggregate.html)
