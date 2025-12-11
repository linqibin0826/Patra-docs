
> 本文基于 MyBatis-Plus 3.5.12 版本，深度剖析批量插入的各种方案、性能差异、事务陷阱与最佳实践。无论你是刚接触 MP 的新手，还是需要优化百万级数据导入的老司机，这篇文章都能帮你少走弯路。

## 一、先说结论：90% 的人用错了 saveBatch

如果你现在的代码是这样的：

```java
@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    public void importUsers(List<User> users) {
        // 很多人以为这样就是"批量插入"了
        Db.saveBatch(users);
    }
}
```

**恭喜你，踩了第一个坑！** 在默认配置下，这段代码的性能和你写 `for` 循环逐条插入几乎没区别。

为什么？因为 MySQL JDBC 驱动默认会把你的"批量"操作拆成一条条单独发送。想让批量插入真正生效，你至少需要在 JDBC URL 里加上这个参数：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb?rewriteBatchedStatements=true
```

**这是本文最重要的一句话，记不住其他的没关系，这个必须记住！**

---

## 二、MyBatis-Plus 批量插入全家桶

MP 提供了多种批量插入方案，它们在底层原理、性能表现、使用场景上各有不同：

| 方案                      | 一句话描述             | 性能    | 适用场景             |
| ----------------------- | ----------------- | ----- | ---------------- |
| `IService.saveBatch`    | 最常用，基于 JDBC Batch | ⭐⭐⭐   | 日常业务             |
| `Db.saveBatch`          | 静态方法版 saveBatch   | ⭐⭐⭐   | 工具类/非 Service 场景 |
| `InsertBatchSomeColumn` | 真·批量插入（SQL 拼接）    | ⭐⭐⭐⭐⭐ | 大数据量导入           |
| `MybatisBatch`          | 3.5.4+ 新 API，灵活控制 | ⭐⭐⭐   | 跨 Mapper 混合批量    |
| XML `<foreach>`         | 手写 SQL，最灵活        | ⭐⭐⭐⭐⭐ | 复杂业务逻辑           |

接下来我们逐一拆解。

---

## 三、方案详解

### 3.1 IService.saveBatch —— 最常用但最容易用错

#### 底层原理

当你调用 `userService.saveBatch(users, 1000)` 时，MP 内部做了这些事：

```
1. 开启一个 BATCH 模式的 SqlSession
2. 循环调用 sqlSession.insert(entity) —— 此时 SQL 只是进入 JDBC 队列
3. 每 1000 条调用 sqlSession.flushStatements() —— 真正发送到数据库
4. 事务提交
```

关键点在于 **flushStatements()**。在这一步，JDBC 驱动会检查 `rewriteBatchedStatements` 参数：

- **关闭（默认）**：1000 条 INSERT 语句，1000 次网络往返
- **开启**：驱动把它们重写成一条 `INSERT INTO t VALUES (...), (...), (...)` 语句

#### 代码示例

```java
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchImport(List<User> users) {
        // 默认 batchSize = 1000
        this.saveBatch(users);

        // 或者自定义批次大小
        this.saveBatch(users, 500);
    }
}
```

#### 优点

- ✅ 开箱即用，无需额外配置
- ✅ 支持 MP 的自动填充（createTime、updateTime）
- ✅ 支持主键回填（需要正确配置）
- ✅ 跨数据库兼容

#### 缺点

- ❌ 性能强依赖 `rewriteBatchedStatements`，不开就是假批量
- ❌ 驱动层重写 SQL 会消耗客户端 CPU
- ❌ 不支持复杂场景（如 ON DUPLICATE KEY UPDATE）

---

### 3.2 Db.saveBatch —— 静态方法的便利与风险

`Db` 类是 MP 提供的静态工具类，允许你在任何地方直接操作数据库：

```java
// 在任何地方都能用，不需要注入 Service
Db.saveBatch(userList);
Db.saveBatch(userList, 500);

// 其他常用方法
Db.updateBatchById(userList);
Db.saveOrUpdateBatch(userList);
```

#### 事务陷阱 ⚠️

**`Db.saveBatch` 能自动加入 Spring 事务吗？** 答案是：**能，但有条件**。

它通过 `SqlSessionUtils.getSqlSession()` 检查当前线程是否有 Spring 事务。如果有，就复用事务的连接；如果没有，就开一个独立的会话（自动提交）。

```java
// ✅ 正确：在 @Transactional 方法内调用，会加入事务
@Transactional(rollbackFor = Exception.class)
public void correctUsage(List<User> users) {
    userMapper.updateById(someUser);  // 操作 1
    Db.saveBatch(users);              // 操作 2 —— 与操作 1 在同一事务

    if (someCondition) {
        throw new RuntimeException("回滚");  // 操作 1 和 2 都会回滚
    }
}

// ❌ 错误：没有事务，每批次自动提交
public void wrongUsage(List<User> users) {
    Db.saveBatch(users);  // 独立事务，部分失败无法全部回滚
}

// ❌ 致命错误：异步线程中丢失事务
@Transactional
public void fatalMistake(List<User> users) {
    CompletableFuture.runAsync(() -> {
        Db.saveBatch(users);  // 新线程，没有事务上下文！
    });
}
```

#### 3.5.12 版本的返回值 Bug

在 3.5.7 ~ 3.5.12 版本中，`Db.saveBatch` 可能返回 `false` 即使插入成功！

```java
// ❌ 不要这样写！
if (!Db.saveBatch(users)) {
    throw new RuntimeException("保存失败");  // 可能误杀成功的操作
}

// ✅ 正确做法：通过异常判断
try {
    Db.saveBatch(users);
    // 没有异常就是成功
} catch (Exception e) {
    // 真正的失败
    throw new BusinessException("批量保存失败", e);
}
```

---

### 3.3 InsertBatchSomeColumn —— 真·批量插入之王

如果你需要极致性能，这是你的首选。

#### 原理差异

| saveBatch | InsertBatchSomeColumn |
|-----------|----------------------|
| Java 循环 → JDBC 队列 → 驱动重写 → 数据库 | MyBatis 直接拼接长 SQL → 数据库 |
| `INSERT INTO t VALUES (?); INSERT INTO t VALUES (?);` | `INSERT INTO t VALUES (...), (...), (...)` |

后者跳过了 JDBC 驱动的重写过程，直接生成最优 SQL。

#### 配置步骤

**Step 1：创建自定义 SQL 注入器**

```java
@Component
public class CustomSqlInjector extends DefaultSqlInjector {

    @Override
    public List<AbstractMethod> getMethodList(Class<?> mapperClass, TableInfo tableInfo) {
        List<AbstractMethod> methodList = super.getMethodList(mapperClass, tableInfo);
        // 添加批量插入方法，排除逻辑删除字段和 UPDATE 填充字段
        methodList.add(new InsertBatchSomeColumn(i ->
            !i.isLogicDelete() && i.getFieldFill() != FieldFill.UPDATE));
        return methodList;
    }
}
```

**Step 2：创建扩展 BaseMapper**

```java
public interface EasyBaseMapper<T> extends BaseMapper<T> {

    /// 真·批量插入（仅 MySQL）
    ///
    /// @param entityList 实体集合
    /// @return 影响行数
    int insertBatchSomeColumn(@Param("list") List<T> entityList);
}
```

**Step 3：业务 Mapper 继承扩展接口**

```java
@Mapper
public interface UserMapper extends EasyBaseMapper<User> {
    // 自动拥有 insertBatchSomeColumn 方法
}
```

**Step 4：使用（必须手动分片！）**

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private static final int BATCH_SIZE = 1000;

    @Transactional(rollbackFor = Exception.class)
    public void batchInsert(List<User> users) {
        // 必须分片！否则 SQL 太长会超过 max_allowed_packet
        Lists.partition(users, BATCH_SIZE)
             .forEach(userMapper::insertBatchSomeColumn);
    }
}
```

#### 为什么必须分片？

MySQL 有个参数叫 `max_allowed_packet`（默认 4MB 或 16MB）。如果你一次插入 5 万条数据，生成的 SQL 可能有几十 MB，直接报错：

```
Packet for query is too large (xxx > max_allowed_packet)
```

安全公式：

$$\text{SafeBatchSize} \approx \frac{\text{max\_allowed\_packet} \times 0.8}{\text{单行预估大小}}$$

通常推荐 **1000 ~ 2000 条/批**。

---

### 3.4 MybatisBatch —— 3.5.4+ 的新选择

这是 MP 在 3.5.4 之后引入的 API，适合需要在一个事务中混合多种批量操作的场景。

```java
@Service
@RequiredArgsConstructor
public class OrderService {

    private final SqlSessionFactory sqlSessionFactory;
    private final TransactionTemplate transactionTemplate;

    public void createOrderWithItems(Order order, List<OrderItem> items) {
        transactionTemplate.execute(status -> {
            // 插入订单
            MybatisBatch<Order> orderBatch = new MybatisBatch<>(sqlSessionFactory, List.of(order));
            orderBatch.execute(new MybatisBatch.Method<>(OrderMapper.class).insert());

            // 批量插入订单项
            MybatisBatch<OrderItem> itemBatch = new MybatisBatch<>(sqlSessionFactory, items);
            itemBatch.execute(new MybatisBatch.Method<>(OrderItemMapper.class).insert());

            return null;
        });
    }
}
```

#### 重要警告 ⚠️

**MybatisBatch 不会自动参与 @Transactional 事务！**

它内部直接调用 `SqlSessionFactory.openSession(ExecutorType.BATCH)`，绕过了 Spring 的 `SqlSessionTemplate`。必须使用 `TransactionTemplate` 手动管理事务。

```java
// ❌ 错误：@Transactional 对 MybatisBatch 无效！
@Transactional
public void wrongUsage() {
    MybatisBatch<User> batch = new MybatisBatch<>(sqlSessionFactory, users);
    batch.execute(new MybatisBatch.Method<>(UserMapper.class).insert());
    throw new RuntimeException("不会回滚！");
}

// ✅ 正确：使用 TransactionTemplate
public void correctUsage() {
    transactionTemplate.execute(status -> {
        MybatisBatch<User> batch = new MybatisBatch<>(sqlSessionFactory, users);
        batch.execute(new MybatisBatch.Method<>(UserMapper.class).insert());
        throw new RuntimeException("会回滚");
    });
}
```

---

### 3.5 原生 XML foreach —— 灵活性之王

当你需要 `ON DUPLICATE KEY UPDATE` 或其他复杂逻辑时，手写 XML 是唯一选择：

```xml
<insert id="insertOrUpdateBatch">
    INSERT INTO user (id, name, email, status)
    VALUES
    <foreach collection="list" item="item" separator=",">
        (#{item.id}, #{item.name}, #{item.email}, #{item.status})
    </foreach>
    ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        email = VALUES(email),
        status = VALUES(status)
</insert>
```

同样需要注意分片，防止 SQL 过长。

---

## 四、性能对比：数据说话

测试环境：MySQL 8.0，本地网络，10,000 条 User 记录

| 方案                    | 配置            | 耗时 (ms) | 相对性能    |
| --------------------- | ------------- | ------- | ------- |
| for 循环单条插入            | -             | ~15,000 | 1x (基准) |
| saveBatch             | 默认（无 rewrite） | ~12,500 | 1.2x    |
| saveBatch             | rewrite=true  | ~850    | **18x** |
| InsertBatchSomeColumn | 分片 2000       | ~450    | **33x** |
| XML foreach           | 分片 2000       | ~460    | **33x** |

**关键发现**：

1. **不开 rewriteBatchedStatements，saveBatch 几乎没用**
2. 开启 rewrite 后，性能提升 15 倍以上
3. InsertBatchSomeColumn 比 rewrite 版 saveBatch 还快约 1 倍

---

## 五、主键回填：另一个大坑

### 问题描述

很多业务需要在批量插入后获取数据库生成的自增 ID：

```java
List<User> users = buildUsers();  // id 都是 null
userService.saveBatch(users);
// 期望：users 里的每个对象都有 id 了
```

### 各方案支持情况

| 方案 | 主键回填 | 可靠性 | 说明 |
|------|---------|--------|------|
| saveBatch | ✅ | 中 | 依赖驱动实现，rewrite 模式下可能有问题 |
| Db.saveBatch | ✅ | 中 | 同上 |
| InsertBatchSomeColumn | ❌ | - | 默认不支持，需魔改注入器 |
| XML foreach | ✅ | 高 | 显式配置 `useGeneratedKeys="true"` |

### 终极解决方案：雪花算法

与其和主键回填斗智斗勇，不如直接在 Java 层生成 ID：

```java
@TableId(type = IdType.ASSIGN_ID)  // 使用雪花算法
private Long id;
```

优势：
- 插入前 ID 就已确定，不依赖数据库
- 天然支持分库分表
- 彻底消除回填的不确定性

---

## 六、事务回滚避坑指南

### 坑 1：异常被吞噬

```java
// ❌ 最常见的错误！
@Transactional
public void saveData(List<User> users) {
    try {
        Db.saveBatch(users);
    } catch (Exception e) {
        log.error("保存失败", e);
        // 异常被吃掉了，Spring 以为方法正常结束，执行 commit！
    }
}

// ✅ 修复方案 1：重新抛出
@Transactional
public void saveData(List<User> users) {
    try {
        Db.saveBatch(users);
    } catch (Exception e) {
        log.error("保存失败", e);
        throw e;  // 或 throw new BusinessException(e);
    }
}

// ✅ 修复方案 2：标记回滚
@Transactional
public void saveData(List<User> users) {
    try {
        Db.saveBatch(users);
    } catch (Exception e) {
        log.error("保存失败", e);
        TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
    }
}
```

### 坑 2：异步线程丢失事务

```java
// ❌ 新线程没有事务上下文
@Transactional
public void asyncSave(List<User> users) {
    CompletableFuture.runAsync(() -> {
        Db.saveBatch(users);  // 这个在新线程，主线程事务管不到它
    });
}

// ✅ 如果必须异步，手动管理事务
public void asyncSave(List<User> users) {
    CompletableFuture.runAsync(() -> {
        transactionTemplate.execute(status -> {
            Db.saveBatch(users);
            return null;
        });
    });
}
```

### 坑 3：BATCH 执行器的延迟异常

批处理的 SQL 真正执行是在 `flushStatements()` 时刻，不是调用 `insert()` 时。这意味着异常可能"延迟爆发"：

```java
@Transactional
public void delayedError() {
    for (User user : users) {
        sqlSession.insert("User.insert", user);  // 此时不会报错
    }
    // 真正的错误在这里才抛出
    sqlSession.flushStatements();  // DuplicateKeyException!
}
```

---

## 七、最佳实践清单

### 必做项 ✅

1. **开启 rewriteBatchedStatements**
   ```
   jdbc:mysql://host:3306/db?rewriteBatchedStatements=true
   ```

2. **使用雪花算法主键**
   ```java
   @TableId(type = IdType.ASSIGN_ID)
   private Long id;
   ```

3. **合理设置批次大小**
   - saveBatch：1000（默认）
   - InsertBatchSomeColumn：1000 ~ 2000

4. **事务内使用，保证原子性**
   ```java
   @Transactional(rollbackFor = Exception.class)
   ```

5. **不吞异常**

### 场景化选型

| 场景 | 推荐方案 |
|------|---------|
| 日常 CRUD（< 500 条） | `IService.saveBatch` |
| 大数据导入（> 5000 条） | `InsertBatchSomeColumn` |
| 需要 ON DUPLICATE KEY | XML `<foreach>` |
| 工具类/非 Service 场景 | `Db.saveBatch` |
| 跨 Mapper 混合批量 | `MybatisBatch` + `TransactionTemplate` |

### 数据库调优

```sql
-- 增大单次传输包大小
SET GLOBAL max_allowed_packet = 64 * 1024 * 1024;  -- 64MB

-- 增大 InnoDB 缓冲池（物理内存的 50-80%）
SET GLOBAL innodb_buffer_pool_size = 4G;

-- 增大日志文件大小，减少 Checkpoint 频率
SET GLOBAL innodb_log_file_size = 512M;
```

---

## 八、总结

MyBatis-Plus 的批量插入看似简单，实则暗藏玄机。记住这几个关键点：

1. **rewriteBatchedStatements=true 是灵魂开关**，不开一切白搭
2. **saveBatch 能参与 @Transactional 事务**，但 MybatisBatch 不能
3. **InsertBatchSomeColumn 性能最强**，但需要手动分片
4. **主键回填不可靠**，建议用雪花算法
5. **事务内不要吞异常**，否则回滚失效

希望这篇文章能帮你在项目中少踩坑，写出高性能、高可靠的批量插入代码！

---

*参考资料：*
- *MyBatis-Plus 官方文档 [baomidou.com](https://baomidou.com)*
- *MySQL Connector/J 文档*
- *MyBatis-Spring 事务管理机制*
