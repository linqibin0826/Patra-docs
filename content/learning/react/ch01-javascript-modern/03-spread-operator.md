---
title: 展开运算符
chapter: 01
section: 03
status: 已完成
progress:
  started_at: 2025-12-03
  completed_at: 2025-12-03
  mastery: 熟悉
tags:
  - learning/react/ch01
  - tech/javascript
  - tech/es6
---

# 展开运算符

> 数组和对象的浅拷贝、合并——React 不可变更新的核心

---

## 📋 学习目标

- [x] 掌握数组展开运算符的用法
- [x] 掌握对象展开运算符的用法
- [x] 理解浅拷贝的概念和限制
- [x] 在 React 状态更新中正确使用展开运算符

---

## 📖 知识点

### 1. Rest vs Spread —— 同一符号，相反方向

> [!important] 核心概念
> `...` 这三个点根据**位置**有不同含义：
> - **左边（解构时）**：Rest，收集剩余元素
> - **右边（赋值时）**：Spread，展开元素

| 名称 | 位置 | 作用 | 示例 |
|------|------|------|------|
| **Rest（剩余）** | 解构左边 | 收集多个 → 打包成数组 | `const [first, ...rest] = arr` |
| **Spread（展开）** | 解构右边 | 把数组/对象 → 展开成多个 | `const newArr = [...arr]` |

**记忆口诀**：**左收右展**

---

### 2. 数组展开

#### 复制数组

```javascript
const original = [1, 2, 3];
const copied = [...original];

copied.push(4);
console.log(original);  // [1, 2, 3] — 原数组不受影响
```

#### 合并数组

```javascript
const arr1 = [1, 2];
const arr2 = [3, 4];
const merged = [...arr1, ...arr2];  // [1, 2, 3, 4]
```

#### 在特定位置插入

```javascript
const arr = [1, 2, 3];
const withZero = [0, ...arr];       // [0, 1, 2, 3] — 开头插入
const withFour = [...arr, 4];       // [1, 2, 3, 4] — 末尾插入
```

---

### 3. 对象展开

#### 复制对象

```javascript
const user = { name: "小明", age: 25 };
const copied = { ...user };
```

#### 合并对象

```javascript
const defaults = { theme: "light", fontSize: 14 };
const userSettings = { theme: "dark" };

const settings = { ...defaults, ...userSettings };
// { theme: "dark", fontSize: 14 }
```

> [!warning] 顺序决定优先级
> 后展开的属性**覆盖**先展开的同名属性。

#### 复制并修改（最常用）

```javascript
const user = { name: "小明", age: 25 };
const updated = { ...user, age: 26 };
// { name: "小明", age: 26 }
```

**模式**：`{ ...原对象, 要修改的属性 }`

---

### 4. 浅拷贝的陷阱 ⚠️

> [!danger] 重要警告
> 展开运算符只做**浅拷贝**，嵌套对象仍然是同一引用！

```javascript
const user = {
  name: "小明",
  address: { city: "北京" }
};

const copied = { ...user };
copied.address.city = "上海";

console.log(user.address.city);  // "上海" — 原对象也被修改了！
```

**内存结构**：
```
user ──→ { name, address: ──→ { city: "北京" } }
                          ↑
copied ─→ { name, address: ─┘  (指向同一个对象)
```

#### 正确处理嵌套对象

需要**逐层展开**：

```javascript
const correct = {
  ...user,
  address: { ...user.address, city: "上海" }
};
```

---

### 5. React 状态更新模式 ⭐

> [!info] 为什么需要新对象？
> React 用**引用比较**判断状态是否改变：
> ```javascript
> oldState === newState  // true → 没变化，不重新渲染
> oldState !== newState  // true → 变了，触发重新渲染
> ```
> 直接修改原对象，引用没变，React 就"看不见"变化。

#### 添加项目

```tsx
setTodos([...todos, newTodo]);  // 末尾添加
setTodos([newTodo, ...todos]);  // 开头添加
```

#### 更新某一项

```tsx
setTodos(todos.map(todo =>
  todo.id === targetId
    ? { ...todo, completed: true }  // 匹配的：创建新对象
    : todo                           // 不匹配的：原样返回
));
```

#### 删除某一项

```tsx
setTodos(todos.filter(todo => todo.id !== targetId));
```

> [!tip] map vs filter
> - **map**：一一映射，元素数量**不变**
> - **filter**：筛选过滤，元素数量**可能减少**

---

### 6. 剩余参数（函数中的 Rest）

```javascript
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}

sum(1, 2, 3);       // 6
sum(1, 2, 3, 4, 5); // 15
```

#### 结合普通参数

```javascript
function multiplySum(multiplier, ...numbers) {
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  return sum * multiplier;
}

multiplySum(2, 1, 2, 3);  // (1+2+3) * 2 = 12
```

> [!warning] 注意
> 剩余参数必须放在**最后**。

---

## ⚠️ 易错点总结

### 1. 引用赋值 vs 展开复制

```javascript
const arr = [1, 2, 3];

const ref = arr;      // ❌ 引用赋值：同一个数组
const copy = [...arr]; // ✅ 展开复制：新数组

ref.push(4);
console.log(arr);  // [1, 2, 3, 4] — 原数组被修改！
```

### 2. 原数组不会被 map 修改

```javascript
const todos = [
  { id: 1, completed: false },
  { id: 2, completed: false },
];

const updated = todos.map(todo =>
  todo.id === 1 ? { ...todo, completed: true } : todo
);

console.log(todos[0].completed);   // false — 原数组不变！
console.log(updated[0].completed); // true  — 新数组中是新对象
```

### 3. reduce 需要初始值

```javascript
// ❌ 没有初始值，空数组会报错
numbers.reduce((sum, n) => sum + n)

// ✅ 给初始值 0
numbers.reduce((sum, n) => sum + n, 0)
```

### 4. 先求和再乘 vs 边乘边加

```javascript
// 题目：(1+2+3) × 2 = 12

// ❌ 错误理解：每个数先乘再加
(1×2) + (2×2) + (3×2) = 12  // 结果碰巧对，但逻辑错

// ✅ 正确理解：先求和再乘
(1+2+3) × 2 = 12
```

---

## 🎯 语法速查

| 用法 | 语法 | 示例 |
|------|------|------|
| 数组复制 | `[...arr]` | `const copy = [...arr]` |
| 数组合并 | `[...a, ...b]` | `const merged = [...arr1, ...arr2]` |
| 数组插入 | `[x, ...arr]` | `const withX = [0, ...arr]` |
| 对象复制 | `{...obj}` | `const copy = {...user}` |
| 对象合并 | `{...a, ...b}` | `const merged = {...defaults, ...custom}` |
| 修改属性 | `{...obj, key: val}` | `const updated = {...user, age: 26}` |
| 嵌套更新 | 逐层展开 | `{...obj, nested: {...obj.nested, key: val}}` |
| 剩余参数 | `fn(...args)` | `function sum(...nums) {}` |

---

## 🔗 相关概念

- [[02-destructuring|解构赋值]] — Rest 语法的来源
- [[07-array-methods|数组高阶方法]] — map、filter、reduce 详解
- 后续章节：Immer 库 — 简化嵌套不可变更新

---

## ✏️ 练习

完成练习并运行测试验证：

| 练习文件 | 验证命令 |
|----------|----------|
| [03-spread-operator.tsx](idea://open?file=/Users/linqibin/Desktop/Patra/patra-react-playground/src/exercises/ch01/03-spread-operator.tsx) | `pnpm test 03-spread-operator` |

---

## 🔗 导航

- 上一节：[[02-destructuring|解构赋值]]
- 下一节：[[04-template-literals|模板字符串]]
