---
type: adr
adr_id: "012"
date: 2025-12-07
status: accepted
date_decided: 2025-12-07
deciders: [linqibin]
technical_debt: none
tags:
  - decision/architecture
  - domain/catalog
  - infrastructure/http
  - performance/memory
---

# ADR-012: 流式下载架构（替代临时文件下载）

## 状态

**accepted**

## 背景

在 patra-catalog 服务的 MeSH/Venue/Serfile 数据导入流程中，原设计采用"下载到临时文件后解析"的方式：

1. **FileDownloadPort**：下载远程 XML/JSON 文件到本地临时目录
2. **MeshSourceFilePort**：管理 MeSH 源文件的下载和缓存
3. **FileDownloadAdapter**：实现下载逻辑，支持进度监控和断点续传
4. **MeshSourceFileAdapter**：实现 MeSH 源文件管理，包括临时文件清理

### 问题

1. **磁盘 I/O 开销**：大文件（如 MeSH desc2025.xml 约 400MB）需要完整写入磁盘后再读取解析
2. **资源浪费**：下载完成后需要额外的清理逻辑删除临时文件
3. **复杂度**：需要管理临时文件生命周期、处理清理失败等边缘情况
4. **环境依赖**：需要足够的磁盘空间和适当的临时目录权限

### 原 Port 设计

```java
public interface FileDownloadPort {
    Path download(URI url, String targetPath);
}

public interface MeshSourceFilePort {
    Path prepareDescriptorFile(String downloadUrl, String meshVersion);
    Path prepareQualifierFile(String downloadUrl, String meshVersion);
    void cleanup(Path filePath);
}
```

Parser 端口接收 `Path` 参数：

```java
public interface MeshDescriptorParserPort {
    Stream<MeshDescriptorAggregate> parse(Path xmlPath);
}
```

## 决策

我们采用"流式下载"方案，直接将 HTTP 响应体作为 InputStream 传递给 Parser，无磁盘落盘：

### 1. 新增 StreamingDownloadPort

在 Domain 层定义流式下载端口：

```java
public interface StreamingDownloadPort {
    StreamingDownloadResult download(URI url);
}

public record StreamingDownloadResult(
    InputStream inputStream,
    long contentLength,
    String contentType
) implements AutoCloseable {
    @Override
    public void close() throws Exception {
        if (inputStream != null) {
            inputStream.close();
        }
    }
}
```

### 2. 新增 StreamingDownloadAdapter

在 Infra 层实现流式下载适配器：

```java
@Component
public class StreamingDownloadAdapter implements StreamingDownloadPort {

    private final RestClient restClient;

    public StreamingDownloadAdapter(@Qualifier("longRunningRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    public StreamingDownloadResult download(URI url) {
        return restClient.get()
            .uri(url)
            .exchange((request, response) -> {
                HttpStatusCode status = response.getStatusCode();
                if (status.isError()) {
                    throw new FileDownloadException("HTTP 错误：" + status.value());
                }
                return new StreamingDownloadResult(
                    response.getBody(),
                    response.getHeaders().getContentLength(),
                    response.getHeaders().getContentType().toString()
                );
            }, false);  // close=false：不自动关闭响应体
    }
}
```

### 3. Parser 接口改为接收 InputStream

```java
public interface MeshDescriptorParserPort {
    Stream<MeshDescriptorAggregate> parse(InputStream inputStream);
}

public interface MeshQualifierParserPort {
    Stream<MeshQualifierAggregate> parse(InputStream inputStream);
}

public interface SerfileParserPort {
    Stream<PubmedSerialData> parse(InputStream inputStream);
}
```

### 4. ItemReader 在 open() 时建立 HTTP 连接

```java
public class MeshDescriptorItemReader implements ItemStreamReader<MeshDescriptorAggregate> {

    private StreamingDownloadResult downloadResult;
    private Stream<MeshDescriptorAggregate> stream;

    @Override
    public void open(ExecutionContext executionContext) {
        // 建立 HTTP 连接，获取 InputStream
        downloadResult = streamingDownloadPort.download(URI.create(downloadUrl));

        // 委托 Parser 解析
        stream = descriptorParserPort.parse(downloadResult.inputStream())
            .map(d -> d.withMeshVersion(meshVersion));

        iterator = stream.iterator();
    }

    @Override
    public void close() {
        // 关闭 Stream（释放 XMLStreamReader）
        if (stream != null) stream.close();

        // 关闭 HTTP 连接
        if (downloadResult != null) downloadResult.close();
    }
}
```

### 5. 删除的文件

| 文件 | 说明 |
|------|------|
| `FileDownloadPort.java` | 文件下载端口接口 |
| `FileDownloadAdapter.java` | 文件下载适配器实现 |
| `MeshSourceFilePort.java` | MeSH 源文件管理端口 |
| `MeshSourceFileAdapter.java` | MeSH 源文件管理适配器 |

## 后果

### 正面影响

- **零磁盘 I/O**：HTTP 响应体直接传递给 Parser，无临时文件写入
- **内存友好**：StAX 流式解析，内存占用与数据量无关
- **简化逻辑**：无需临时文件清理逻辑，减少 4 个文件/类
- **启动更快**：无需等待完整下载，边下载边解析
- **资源管理清晰**：`StreamingDownloadResult` 实现 `AutoCloseable`，配合 try-with-resources 使用

### 负面影响

- **断点续传需重新下载**：Job 重启时需从头下载文件
- **网络依赖延长**：整个处理过程 HTTP 连接保持打开
- **错误恢复受限**：网络中断后需重新开始

### 断点续传权衡

| 方面 | 临时文件方案 | 流式下载方案 |
|------|------------|------------|
| 断点续传精度 | chunk size（500 条） | chunk size（500 条） |
| Job 重启代价 | 无需重新下载 | 需重新下载 |
| 跳过已处理记录 | 直接 seek | 需流式跳过 |
| 复杂度 | 需管理临时文件 | 简单直接 |

**权衡决定**：考虑到 MeSH 文件年度更新（非频繁操作）、下载速度较快（NLM 服务器稳定）、简化代码优先，接受重新下载的代价。

### 超时配置

使用 `longRunningRestClient` Bean（10 分钟读取超时），适合大文件流式读取场景。可通过配置调整：

```yaml
patra:
  rest-client:
    clients:
      long-running:
        timeout: PT10M  # 10 分钟
```

## 替代方案

### 方案 A：保持临时文件 + 优化清理逻辑（不采用）

保持原设计，改进临时文件清理机制（如使用 shutdown hook）。

**优点**：断点续传无需重新下载

**缺点**：
- 仍有磁盘 I/O 开销
- 临时文件管理复杂度不变
- 需要足够磁盘空间

### 方案 B：内存缓存全部数据（不采用）

下载后将数据缓存在内存中，然后解析。

**优点**：无磁盘 I/O

**缺点**：
- 大文件会导致 OOM
- 不适合 400MB 级别的 MeSH 文件

### 方案 C：分块下载 + 流式处理（不采用）

使用 HTTP Range 请求分块下载，支持真正的断点续传。

**优点**：精确断点续传

**缺点**：
- XML 无法随意分块（需要完整元素边界）
- 增加实现复杂度
- NLM 服务器可能不支持 Range 请求

## 参考资料

- [[ADR-006]] MeSH 源文件缓存策略（已被本 ADR 替代）
- [[ADR-009]] RestClient 下载进度监控
- [Spring RestClient exchange() 方法](https://docs.spring.io/spring-framework/reference/integration/rest-clients.html)
- [StAX 流式解析](https://docs.oracle.com/javase/tutorial/jaxp/stax/index.html)
