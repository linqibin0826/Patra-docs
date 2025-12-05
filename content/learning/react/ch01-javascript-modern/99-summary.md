---
title: 第 1 章总结
chapter: 01
section: 99
type: chapter-summary
status: 已完成
progress:
  started_at: 2025-12-04
  completed_at: 2025-12-04
  mastery: 熟悉
tags:
  - learning/react/ch01
  - tech/javascript
  - tech/es6
---

# 第 1 章总结：JavaScript 现代化

> 本章覆盖了 React 开发中最常用的 ES6+ 语法特性，为后续学习打下坚实基础。

---

## 📋 知识地图

```
JavaScript 现代化
├── 语法糖
│   ├── 01 箭头函数      → this 词法绑定、简洁语法
│   ├── 02 解构赋值      → 对象/数组解构、默认值、重命名
│   ├── 03 展开运算符    → 复制、合并、剩余参数
│   └── 04 模板字符串    → 插值、多行、标签模板
│
├── 异步编程
│   └── 05 async/await   → Promise 语法糖、try/catch 错误处理
│
├── 模块化
│   └── 06 ES6 模块      → import/export、命名导出 vs 默认导出
│
└── 数据处理
    ├── 07 数组高阶方法  → map/filter/reduce、链式调用
    └── 08 可选链        → ?.、??、安全访问嵌套属性
```

---

## 🎯 核心概念速查

### 1. 箭头函数

```javascript
// 语法简洁
const add = (a, b) => a + b;

// this 词法绑定（不会丢失）
const obj = {
  name: "张三",
  greet: function() {
    setTimeout(() => {
      console.log(this.name);  // ✅ "张三"
    }, 100);
  }
};
```

**要点**：箭头函数没有自己的 `this`，向外层作用域查找。

---

### 2. 解构赋值

```javascript
// 对象解构
const { name, age = 18 } = user;

// 数组解构
const [first, ...rest] = items;

// 重命名
const { name: userName } = user;
```

**要点**：默认值只在 `undefined` 时生效，`null` 不会触发。

---

### 3. 展开运算符

```javascript
// 复制数组/对象（浅拷贝）
const newArr = [...arr];
const newObj = { ...obj };

// 合并
const merged = { ...defaults, ...userSettings };

// 剩余参数
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
```

**要点**：展开是浅拷贝，嵌套对象需要逐层展开。

---

### 4. 模板字符串

```javascript
// 插值
const msg = `Hello, ${name}!`;

// 多行
const html = `
  <div>
    <h1>${title}</h1>
  </div>
`;

// 表达式
const price = `总价：${qty * unitPrice} 元`;
```

**要点**：`${}` 内可以是任何 JavaScript 表达式。

---

### 5. async/await

```javascript
async function fetchUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("请求失败:", error);
    throw error;
  }
}
```

**要点**：`await` 只能在 `async` 函数中使用，用 `try/catch` 捕获错误。

---

### 6. ES6 模块化

```javascript
// 命名导出（可多个）
export const foo = 1;
export function bar() {}

// 默认导出（只能一个）
export default class User {}

// 导入
import User from './User';           // 默认导出，名字任意
import { foo, bar } from './utils';  // 命名导出，名字必须匹配
```

**要点**：默认导出导入时可任意命名，命名导出必须用 `{}`。

---

### 7. 数组高阶方法

```javascript
// map - 一对一转换
const names = users.map(u => u.name);

// filter - 筛选
const adults = users.filter(u => u.age >= 18);

// reduce - 聚合
const total = prices.reduce((sum, p) => sum + p, 0);

// 链式调用
const result = users
  .filter(u => u.active)
  .map(u => u.name)
  .sort();
```

**口诀**：
- `map`：转换 🍎🍊🍋 → 🧃🧃🧃
- `filter`：筛选 🍎🍊🍋 → 🍎
- `reduce`：聚合 🍎🍊🍋 → 🥗

---

### 8. 可选链和空值合并

```javascript
// 安全访问嵌套属性
const city = user?.address?.city;

// 安全调用方法
const result = obj.method?.();

// 安全访问数组
const first = arr?.[0];

// 提供默认值（只针对 null/undefined）
const name = user?.name ?? "匿名";
```

**要点**：
- `?.` 只保护左边那一个位置
- `??` 只对 `null`/`undefined` 生效
- `||` 对所有 falsy 值生效

---

## 📊 运算符对比表

| 运算符 | 名称 | 触发条件 | 常见用途 |
|--------|------|----------|----------|
| `\|\|` | 逻辑或 | 左边是 falsy | 旧式默认值 |
| `??` | 空值合并 | 左边是 null/undefined | 精确默认值 |
| `?.` | 可选链 | 左边是 null/undefined | 安全访问 |
| `&&` | 逻辑与 | 左边是 truthy 才继续 | 条件执行 |
| `...` | 展开/剩余 | - | 复制、合并、收集 |

---

## ⚠️ 常见陷阱

### 1. 解构默认值 vs `??`

```javascript
// 解构默认值：只对 undefined 生效
const { value = 0 } = { value: null };  // value = null ❌

// ??：对 null 和 undefined 都生效
const value = input ?? 0;  // null → 0 ✅
```

### 2. 浅拷贝陷阱

```javascript
const user = { address: { city: "北京" } };
const copy = { ...user };
copy.address.city = "上海";  // ❌ 原对象也被修改了！

// 正确做法
const copy = { ...user, address: { ...user.address } };
```

### 3. `?.` 作用范围

```javascript
// ❌ 只保护了 user，后面的 .city 没保护
user?.address.city  // 如果 address 是 undefined 会报错

// ✅ 每一层都要保护
user?.address?.city
```

### 4. map 中修改原对象

```javascript
// ❌ 危险：直接修改原对象
users.map(u => { u.age++; return u; });

// ✅ 安全：返回新对象
users.map(u => ({ ...u, age: u.age + 1 }));
```

---

## 🧪 综合测验

### Q1: 综合应用

```javascript
const data = {
  users: [
    { name: "Alice", profile: { city: "Beijing" } },
    { name: "Bob", profile: null }
  ]
};

const result = data.users
  .filter(u => u.profile?.city)
  .map(u => `${u.name} - ${u.profile.city}`);

console.log(result);
```

> [!success]- 查看答案
> **答案：`["Alice - Beijing"]`**
>
> - `filter` 使用可选链 `u.profile?.city`，Bob 的 profile 是 null，`null?.city` 返回 undefined（falsy），被过滤掉
> - `map` 只处理 Alice，使用模板字符串拼接

### Q2: 默认值陷阱

```javascript
const config = { timeout: 0, retries: null };
const timeout = config.timeout || 5000;
const retries = config.retries ?? 3;

console.log(timeout, retries);
```

> [!success]- 查看答案
> **答案：`5000, 3`**
>
> - `timeout`：0 是 falsy，`||` 会用默认值 5000
> - `retries`：null 触发 `??`，使用默认值 3

---

## 🔗 在 React 中的应用预告

| 特性 | React 应用场景 |
|------|----------------|
| 箭头函数 | 事件处理、回调函数 |
| 解构赋值 | Props 解构、useState 返回值 |
| 展开运算符 | 状态更新、Props 传递 |
| 模板字符串 | 动态类名、样式 |
| async/await | 数据获取、API 调用 |
| ES6 模块 | 组件导入导出 |
| 数组方法 | 列表渲染（map）、条件过滤 |
| 可选链 | 安全访问 props、API 响应 |

---

## ✅ 完成检查清单

- [x] 01 箭头函数 - this 绑定理解清晰
- [x] 02 解构赋值 - 注意默认值只对 undefined 生效
- [x] 03 展开运算符 - 浅拷贝理解到位
- [x] 04 模板字符串 - 标签模板后续再深入
- [x] 05 async/await - try/catch 错误处理
- [x] 06 ES6 模块化 - default 导入可任意命名
- [x] 07 数组高阶方法 - map/filter/reduce 场景清晰
- [x] 08 可选链 - ?? vs || 区别明确
- [x] 99 章节总结 - 回顾测验全部通过

---

## 🚀 下一步

**第 2 章：React 基础概念**

你将学习：
- JSX 语法与原理
- 组件化思想
- Props 与组件通信
- 条件渲染与列表渲染
- 事件处理

带着这些扎实的 JavaScript 基础，React 学起来会轻松很多！

---

## 🔗 导航

- 上一节：[[08-optional-chaining|可选链和空值合并]]
- 下一章：[[../ch02-react-basics/00-overview|React 基础概念]]
