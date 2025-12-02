# PubMed 批量数据下载注意事项

> 创建时间: 2024-12-02
> 状态: inbox
> 标签: #pubmed #data-import #spring-batch

## FTP 下载地址

| 数据类型 | FTP 地址 | 说明 |
|---------|---------|------|
| **年度 Baseline** | https://ftp.ncbi.nlm.nih.gov/pubmed/baseline/ | 完整的历史数据快照 |
| **每日更新** | https://ftp.ncbi.nlm.nih.gov/pubmed/updatefiles/ | 增量更新（新增/修改/删除） |

## 2025 Baseline 文件信息

- **文件数量**：1274 个 XML 文件
- **命名规则**：`pubmed25n0001.xml` 到 `pubmed25n1274.xml`
- **更新文件**：从 `pubmed25n1275.xml` 开始
- **校验文件**：每个 XML 文件都有对应的 MD5 校验文件
- **下载要求**：必须使用**二进制模式**下载

## 文件格式

Baseline 和 Update 文件使用**相同的 DTD**（pubmed_250101.dtd），结构如下：

```xml
<PubmedArticleSet>
    <PubmedArticle>           <!-- 0 或多个 -->
        <MedlineCitation>...</MedlineCitation>  <!-- 核心引文数据 -->
        <PubmedData>...</PubmedData>            <!-- 可选的扩展数据 -->
    </PubmedArticle>
    <PubmedBookArticle>...</PubmedBookArticle>  <!-- 0 或多个，书籍章节 -->
    <DeleteCitation>          <!-- ⚠️ 仅在 Update 文件中出现 -->
        <PMID>12345678</PMID>
    </DeleteCitation>
</PubmedArticleSet>
```

## Baseline vs Update 对比

| 特性 | Baseline 文件 | Update 文件 |
|------|--------------|-------------|
| **DTD** | 相同（pubmed_250101.dtd） | 相同 |
| **PubmedArticle** | ✅ 全量数据 | ✅ 新增 + 修订 |
| **DeleteCitation** | ❌ 不包含 | ✅ 包含已删除 PMID |
| **处理方式** | INSERT | INSERT/UPDATE/DELETE |

## 关键注意事项

### 1. DeleteCitation 特殊性
- **只能通过 FTP 获取**，E-utilities API 和 Web 界面都无法检索
- 设计 Spring Batch Job 时必须考虑

### 2. Update 文件语义
- 同一个 PMID 再次出现表示**修订**（应覆盖本地数据），不是新增

### 3. 处理顺序至关重要
- **必须**先加载完所有 Baseline 文件
- 再按文件序号顺序加载 Update 文件
- 否则会导致数据不一致

### 4. 2025 DTD 新特性
- `AutoHM="Y"` 属性：区分人工/自动标注
- `IndexingMethod="Manual"`：标识手工索引记录

## 推荐导入策略

```
1. 下载 Baseline（1274 个 XML 文件，约 70GB 压缩后）
         ↓
2. Spring Batch 分批解析 XML → 转换 → 批量写入 DB
         ↓
3. 每日调度任务处理 updatefiles（增量同步）
```

## Spring Batch 设计建议

1. **ItemReader**：使用 `StaxEventItemReader` 解析 XML（流式处理，避免 OOM）
2. **Chunk 大小**：建议 500-1000 条/chunk，配合 `insertBatchSomeColumn` 批量插入
3. **断点续传**：利用文件序号（n0001-n1274）作为 JobParameter，支持从失败文件恢复
4. **并行处理**：可使用 `PartitionStep` 将 1274 个文件分配到多个线程并行处理
5. **Update 文件**：设计 CompositeStep，先处理 DeleteCitation（软删除），再处理 PubmedArticle（UPSERT）

## 参考资料

- [PubMed Download Page](https://pubmed.ncbi.nlm.nih.gov/download/)
- [NLM - Access PubMed Data](https://www.nlm.nih.gov/databases/download/pubmed_medline.html)
- [PubMed 2025 Baseline Release](https://www.nlm.nih.gov/pubs/techbull/jf25/jf25_pubmed_2025_baseline_beta.html)
- [PubMed 2025 DTD Documentation](https://dtd.nlm.nih.gov/ncbi/pubmed/doc/out/250101/index.html)
