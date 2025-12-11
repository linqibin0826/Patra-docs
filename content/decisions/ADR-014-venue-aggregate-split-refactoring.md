---
type: adr
adr_id: "014"
date: 2025-12-08
status: accepted
date_decided: 2025-12-08
deciders: [linqibin]
technical_debt: none
tags:
  - decision/architecture
  - domain/catalog
  - ddd/aggregate
  - refactoring
---

# ADR-014: VenueAggregate 聚合拆分重构

## 状态

**accepted**

## 背景

在 [[ADR-010]] 和 [[ADR-011]] 中，我们为 `VenueAggregate` 设计了多数据源融合架构，包含 5 个子实体集合：

1. `identifiers` - 载体标识符（ISSN、OpenAlex ID、NLM ID 等）
2. `yearlyMetrics` - 年度发文统计（来源 OpenAlex）
3. `meshTerms` - MeSH 主题词（来源 Serfile）
4. `relations` - 期刊关联关系（来源 Serfile）
5. `indexingHistories` - 索引历史（来源 Serfile）

随着功能迭代，`VenueAggregate` 膨胀至约 1030 行代码，违反了 Vaughn Vernon 提出的**"设计小聚合"**原则。

### 问题分析

基于 Vaughn Vernon 聚合设计四规则进行分析：

| 子实体 | 数据来源 | 与 Venue 的关系 | 聚合级不变量 | 结论 |
|--------|----------|----------------|-------------|------|
| identifiers | OpenAlex + Serfile | 身份标识（用于去重匹配） | **有**（ISSN-L 唯一性） | ✅ 保留 |
| yearlyMetrics | OpenAlex | 补充数据 | 无 | ❌ 移出 |
| meshTerms | Serfile | 补充数据 | 无 | ❌ 移出 |
| relations | Serfile | 补充数据 | 无 | ❌ 移出 |
| indexingHistories | Serfile | 补充数据 | 无 | ❌ 移出 |

**关键发现**：后 4 个子实体之间**无业务关联**，无聚合级不变量需要保护，只是"数据集合"。

## 决策

### 1. 聚合边界重新划分

**VenueAggregate 精简**（约 720 行）：
- 保留核心属性（venueType, displayName, 冗余标识符字段...）
- 保留值对象（publicationHistory, indexingInfo, hostOrganization...）
- 保留快照字段（latestRating, currentStats）
- **保留 `identifiers` 集合**（有 ISSN-L 唯一性不变量需要保护）

**独立子实体集合**（通过 Repository 直接管理）：
- `VenuePublicationStats`（年度发文统计）
- `VenueMesh`（MeSH 主题词）
- `VenueRelation`（期刊关联关系）
- `VenueIndexingHistory`（索引历史）

### 2. 实体类改为 Record（值对象语义）

将 5 个实体类从 Class 改为 Java Record，体现不可变值对象语义：

```java
// 改造前（可变 Class）
public class VenueIdentifier implements Serializable {
    private Long id;
    private VenueIdentifierType type;
    private String value;
    // getter/setter...
}

// 改造后（不可变 Record）
public record VenueIdentifier(
    VenueIdentifierType type,
    String value
) implements Serializable {
    public VenueIdentifier {
        Assert.notNull(type, "标识符类型不能为空");
        Assert.notBlank(value, "标识符值不能为空");
    }
}
```

**设计原则**：
- Domain 层使用 Record（无 ID），Infrastructure 层使用 DO（有 ID）
- ID 仅用于数据库存储，业务上可完全替换

### 3. VenueRepository 接口扩展

在 `VenueRepository` 中新增补充数据管理方法，保持**单一聚合入口**原则：

```java
public interface VenueRepository {
    // ... 原有聚合根方法 ...

    // ==================== 补充数据管理 ====================

    // 年度指标（OpenAlex 导入）
    Map<Long, List<VenuePublicationStats>> findYearlyMetricsByVenueIds(Collection<Long> venueIds);
    void replaceYearlyMetricsBatch(Map<Long, List<VenuePublicationStats>> metricsByVenueId);

    // MeSH 主题词（Serfile 导入）
    Map<Long, List<VenueMesh>> findMeshTermsByVenueIds(Collection<Long> venueIds);
    void replaceMeshTermsBatch(Map<Long, List<VenueMesh>> meshTermsByVenueId);

    // 关联关系（Serfile 导入）
    Map<Long, List<VenueRelation>> findRelationsByVenueIds(Collection<Long> venueIds);
    void replaceRelationsBatch(Map<Long, List<VenueRelation>> relationsByVenueId);

    // 索引历史（Serfile 导入）
    Map<Long, List<VenueIndexingHistory>> findIndexingHistoriesByVenueIds(Collection<Long> venueIds);
    void replaceIndexingHistoriesBatch(Map<Long, List<VenueIndexingHistory>> historiesByVenueId);

    // Serfile 导入便捷方法（同一事务）
    void replaceSerfileDataBatch(
        Map<Long, List<VenueMesh>> meshTermsByVenueId,
        Map<Long, List<VenueRelation>> relationsByVenueId,
        Map<Long, List<VenueIndexingHistory>> historiesByVenueId);
}
```

**设计理由**：虽然补充数据与聚合根无不变量依赖，但从 DDD 角度，所有与 Venue 相关的数据访问都应通过 `VenueRepository` 这个统一入口，避免 Repository 分散带来的认知负担。

### 4. 导入流程适配

**OpenAlex 导入**：
```java
// VenueInitializeItemWriter
venueRepository.insertAll(aggregates);
venueRepository.replaceYearlyMetricsBatch(metricsByVenueId);
```

**Serfile 导入**：
```java
// VenuePubmedEnrichOrchestrator
venueRepository.updateBatch(aggregates);  // 仅含 identifiers
venueRepository.replaceSerfileDataBatch(meshTerms, relations, histories);
```

### 5. VenueParseResult 复合类型

新建 `VenueParseResult` Record 封装 OpenAlex 解析结果：

```java
public record VenueParseResult(
    VenueAggregate aggregate,
    List<VenuePublicationStats> yearlyMetrics
) {
    public boolean hasYearlyMetrics() {
        return yearlyMetrics != null && !yearlyMetrics.isEmpty();
    }
}
```

## 数据一致性保证

**保持同一事务**：VenueAggregate 更新和补充数据替换在同一事务中完成。

理由：
1. 批处理场景，无高频并发更新
2. 避免引入领域事件和最终一致性的复杂度
3. 业务完整性要求数据完整导入或完整回滚

## 后果

### 正面影响

- **聚合精简**：VenueAggregate 从约 1030 行减少至约 720 行
- **职责清晰**：聚合根专注核心不变量，补充数据独立管理
- **性能优化**：查询聚合根时无需加载所有子实体
- **扩展灵活**：新增补充数据类型无需修改聚合根

### 负面影响

- **接口膨胀**：`VenueRepository` 接口新增 9 个补充数据管理方法
- **实现复杂度**：`VenueRepositoryAdapter` 需要注入 4 个额外的 Mapper

### 风险

- **事务边界**：需确保聚合根和补充数据在同一事务内持久化（由 Application 层 `@Transactional` 统一管理）

## 参考资料

- [Vaughn Vernon - Effective Aggregate Design](https://www.dddcommunity.org/library/vernon_2011/)
- [[ADR-010]] Venue 聚合重构 - 分离标识符和年度指标为独立实体
- [[ADR-011]] Venue 多数据源架构设计
