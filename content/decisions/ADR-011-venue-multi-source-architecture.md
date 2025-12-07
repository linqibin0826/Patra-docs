---
type: adr
adr_id: "011"
date: 2025-12-06
status: accepted
date_decided: 2025-12-06
deciders: [linqibin]
technical_debt: none
tags:
  - decision/architecture
  - domain/catalog
  - ddd/aggregate
  - data-integration
---

# ADR-011: Venue 多数据源架构设计

## 状态

**accepted**

## 背景

在 patra-catalog 服务的 Venue（载体/期刊）数据管理中，需要整合来自多个学术数据源的期刊信息：

1. **OpenAlex**：开放学术数据库，提供期刊基础信息、发文量、被引量
2. **PubMed Catalog**：NLM 官方期刊目录，提供 NLM ID、MEDLINE 收录状态、缩写标题
3. **DOAJ**：开放获取期刊目录，提供 OA 类型、APC 信息
4. **Crossref**：DOI 注册机构，提供出版商信息、DOI 前缀
5. **WOS/JCR**：科睿唯安，提供影响因子、JCR 分区
6. **中科院分区**：国内分区体系，提供中科院分区、TOP 期刊标识

### 挑战

1. **多源数据融合**：同一期刊在不同数据源中使用不同标识符（ISSN、NLM ID、OpenAlex ID 等）
2. **多评价体系**：JCR、中科院分区、Scopus CiteScore 等评价体系各有不同指标
3. **数据溯源**：需要保留各数据源的原始数据，支持审计和问题排查
4. **冗余优化**：高频查询字段（如最新影响因子、分区）需要冗余到主表

### 原设计局限

[[ADR-010]] 设计的 `VenueMetrics` 实体仅支持年度发文/被引统计，无法满足：
- 多评价体系的年度评级数据
- 各数据源的原始数据存储
- PubMed 特有的索引收录信息

## 决策

我们采用"扩展数据模型 + 增加通用表"的方案，具体设计如下：

### 1. VenueAggregate 扩展

在聚合根中新增值对象，支持多数据源字段：

```java
public class VenueAggregate extends BaseAggregateRoot<Long> {
    // 原有字段...

    // === 多数据源扩展字段 ===

    // PubMed 来源字段
    private String nlmId;                    // NLM 唯一标识符
    private PublicationHistory pubHistory;   // 出版历史（创刊/停刊年份）
    private IndexingInfo indexingInfo;       // MEDLINE 索引收录信息

    // Crossref 来源字段
    private String doiPrefix;                // DOI 前缀
    private String publisher;                // 出版商名称

    // DOAJ 来源字段
    private OaStatus oaStatus;               // 开放获取状态（扩展）

    // 评级冗余字段（高频查询优化）
    private LatestRating latestRating;       // 最新评级快照

    // 聚合内实体集合（原有）
    private Set<VenueIdentifier> identifiers;
    private Set<VenuePublicationStats> yearlyStats;  // 重命名自 VenueMetrics
}
```

### 2. 新增值对象

#### PublicationHistory（出版历史）

```java
public record PublicationHistory(
    Integer startYear,   // 创刊年份
    Integer endYear,     // 停刊年份（仍在出版则为 null）
    Boolean ceased       // 是否已停刊
) {
    public static PublicationHistory active(Integer startYear);
    public static PublicationHistory ceased(Integer startYear, Integer endYear);
    public boolean isActive();
    public Integer calculateYearsPublished(int currentYear);
}
```

#### IndexingInfo（索引收录信息）

```java
public record IndexingInfo(
    String status,          // 收录状态：C(当前收录)/Y(部分收录)/N(未收录)/D(已停止)
    String medlineTa,       // MEDLINE 缩写标题
    String isoAbbreviation  // ISO 缩写标题
) {
    public static final String STATUS_CURRENTLY_INDEXED = "C";
    public static final String STATUS_INDEXED_SUBSET = "Y";
    public static final String STATUS_NOT_INDEXED = "N";
    public static final String STATUS_DISCONTINUED = "D";

    public boolean isCurrentlyIndexed();
    public boolean isDiscontinued();
}
```

#### LatestRating（最新评级快照）

```java
public record LatestRating(
    BigDecimal impactScore,  // 影响力分数（JIF/CiteScore/复合IF）
    String quartile,         // 分区（Q1-Q4 或 1-4 区）
    String ratingSystem,     // 评价体系代码
    Integer year             // 评级年份
) {
    public boolean isTopQuartile();
    public Integer getQuartileLevel();  // 解析分区等级 1-4
}
```

### 3. VenueSourceData（数据源实体）

独立实体，非聚合成员，按需加载：

```java
public class VenueSourceData {
    private Long id;
    private Long venueId;
    private DataSourceCode sourceCode;    // OPENALEX/PUBMED/DOAJ/CROSSREF/JCR
    private String sourceId;              // 来源系统中的 ID
    private String rawData;               // 原始 JSON
    private String extractedData;         // 提取的关键字段 JSON
    private LocalDate sourceCreatedAt;    // 源数据创建时间
    private LocalDate sourceUpdatedAt;    // 源数据更新时间
    private Instant fetchedAt;            // 本地抓取时间
}
```

**设计要点**：
- 每个 Venue 每个数据源最多一条记录（`uk_venue_source`）
- `rawData` 存储原始响应，支持数据溯源和问题排查
- `extractedData` 存储提取的关键字段，便于快速查询

### 4. VenueRating（评级实体）

独立实体，支持多评价体系：

```java
public class VenueRating {
    private Long id;
    private Long venueId;
    private int year;                     // 评级年份
    private RatingSystem ratingSystem;    // JCR/CAS/SCOPUS
    private String quartile;              // 分区
    private BigDecimal impactScore;       // 影响力分数
    private String ratingData;            // 评级详情 JSON
    private String categories;            // 学科分类 JSON
}
```

**ratingData JSON 结构示例**：

```json
// JCR
{
  "jif": 42.778,
  "jif_without_self_cites": 41.234,
  "jci": 5.12,
  "eigenfactor": 0.45678,
  "article_influence": 15.234
}

// 中科院分区 (CAS)
{
  "partition": "1区",
  "is_top": true,
  "trend": "up",
  "comprehensive_if": 45.678
}

// Scopus CiteScore
{
  "cite_score": 12.5,
  "snip": 2.345,
  "sjr": 5.678,
  "percentile": 98
}
```

### 5. 数据库表结构

#### cat_venue 扩展字段

| 字段 | 类型 | 说明 | 来源 |
|------|------|------|------|
| `nlm_id` | VARCHAR(20) | NLM 唯一标识符 | PubMed |
| `doi_prefix` | VARCHAR(50) | DOI 前缀 | Crossref |
| `publisher` | VARCHAR(500) | 出版商名称 | Crossref/DOAJ |
| `publication_start_year` | SMALLINT | 创刊年份 | PubMed |
| `publication_end_year` | SMALLINT | 停刊年份 | PubMed |
| `ceased` | BOOLEAN | 是否已停刊 | PubMed |
| `indexing_status` | VARCHAR(32) | MEDLINE 收录状态 | PubMed |
| `medline_ta` | VARCHAR(200) | MEDLINE 缩写 | PubMed |
| `iso_abbreviation` | VARCHAR(200) | ISO 缩写 | PubMed |
| `oa_type` | VARCHAR(20) | OA 类型 | DOAJ |
| `latest_impact_score` | DECIMAL(10,4) | 最新影响力分数 | 冗余 |
| `latest_quartile` | VARCHAR(10) | 最新分区 | 冗余 |
| `latest_rating_system` | VARCHAR(32) | 最新评级体系 | 冗余 |
| `latest_rating_year` | SMALLINT | 最新评级年份 | 冗余 |

#### cat_venue_source_data（新增表）

```sql
CREATE TABLE cat_venue_source_data (
    id BIGINT UNSIGNED PRIMARY KEY,
    venue_id BIGINT UNSIGNED NOT NULL,
    source_code VARCHAR(32) NOT NULL,
    source_id VARCHAR(100),
    raw_data JSON,
    extracted_data JSON,
    source_created_at DATE,
    source_updated_at DATE,
    fetched_at TIMESTAMP(6),
    -- 10 个审计字段
    UNIQUE KEY uk_venue_source (venue_id, source_code)
);
```

#### cat_venue_rating（新增表）

```sql
CREATE TABLE cat_venue_rating (
    id BIGINT UNSIGNED PRIMARY KEY,
    venue_id BIGINT UNSIGNED NOT NULL,
    year SMALLINT NOT NULL,
    rating_system VARCHAR(32) NOT NULL,
    quartile VARCHAR(10),
    impact_score DECIMAL(10,4),
    rating_data JSON,
    categories JSON,
    source_url VARCHAR(500),
    fetched_at TIMESTAMP(6),
    -- 10 个审计字段
    UNIQUE KEY uk_venue_year_system (venue_id, year, rating_system),
    INDEX idx_rating_system (rating_system),
    INDEX idx_year (year),
    INDEX idx_quartile (quartile)
);
```

#### cat_venue_metrics → cat_venue_publication_stats（重命名）

原 `VenueMetrics` 实体专注于年度发文统计，重命名为 `VenuePublicationStats` 更清晰地表达其用途。

### 6. 数据合并策略

#### 匹配优先级

1. **ISSN-L**（最可靠）：Linking ISSN 是期刊的唯一标识
2. **NLM ID**：PubMed 官方 ID
3. **OpenAlex ID**：OpenAlex 系统 ID
4. **ISSN**：可能存在多个（Print/Electronic）

#### 字段合并优先级

| 字段 | 优先级（高 → 低） |
|------|------------------|
| display_name | PubMed > OpenAlex > DOAJ |
| abbreviated_title | PubMed > OpenAlex |
| is_oa | DOAJ > OpenAlex |
| apc_usd | DOAJ > OpenAlex |
| indexing_status | PubMed（唯一来源） |
| latest_impact_score | JCR（唯一来源） |
| publisher | Crossref > DOAJ > OpenAlex |

## 后果

### 正面影响

- **多源融合**：支持来自 5+ 数据源的期刊信息整合
- **多评价体系**：通用评级表支持 JCR、中科院分区、Scopus 等
- **数据溯源**：保留各数据源原始 JSON，支持审计
- **查询优化**：冗余字段优化高频查询性能
- **扩展性**：新增数据源只需扩展枚举和导入逻辑

### 负面影响

- **存储开销**：`rawData` JSON 字段占用额外存储
- **一致性维护**：冗余字段需要同步更新
- **复杂度增加**：多表结构增加查询和维护复杂度

### 风险

- **JSON 查询性能**：`rating_data`/`categories` JSON 字段不建议复杂查询
- **冗余字段同步**：评级数据更新时需同步更新主表冗余字段

## 替代方案

### 方案 A：单一评级表 + 多列设计（不采用）

为每个评价体系创建独立列（如 `jcr_jif`、`cas_partition`、`scopus_cite_score`）。

**优点**：查询简单，无需 JSON 解析

**缺点**：
- 表结构膨胀，每增加评价体系需修改表结构
- 无法支持未知评价体系
- 不同体系的年度数据无法统一管理

### 方案 B：完全分离的评级子系统（不采用）

将评级数据作为独立微服务管理。

**优点**：职责分离，独立演进

**缺点**：
- 过度设计，当前规模不需要
- 增加服务间调用开销
- 数据一致性更难保证

### 方案 C：单一 JSON 字段存储所有评级（不采用）

在 `cat_venue` 表中使用单一 JSON 字段存储所有年度评级。

**优点**：表结构简单

**缺点**：
- 无法按年份/体系建立索引
- 数据量大时 JSON 字段过大
- 更新单个评级需要读写整个 JSON

## 参考资料

- [[ADR-010]] Venue 聚合重构 - 分离标识符和年度指标为独立实体
- [NLM Catalog](https://www.ncbi.nlm.nih.gov/nlmcatalog/)
- [DOAJ API](https://doaj.org/api/v3/docs)
- [Crossref API](https://api.crossref.org/)
- [OpenAlex Sources API](https://docs.openalex.org/api-entities/sources)
