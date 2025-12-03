---
type: til
date: 2025-12-02
topics: [箭头函数, 解构赋值]
learning_series: react
chapters_completed: [ch01]
tags:
  - record/til
  - tech/javascript
  - tech/es6
  - tech/react
---

# 今日学习：JavaScript 现代化 - ES6 核心特性

## 学习概要

正式开启 React 学习之旅，从 JavaScript 现代化基础入手。今天重点学习了 ES6 中最常用的两个特性：箭头函数和解构赋值，这两个语法在 React 开发中几乎无处不在。

## 核心收获

### 1. 箭头函数的 this 绑定机制

- **普通函数**：`this` 由**调用方式**决定（谁调用就指向谁）
- **箭头函数**：`this` 由**定义位置**决定（继承外层作用域的 `this`）

这个差异在 React 事件处理中尤为重要：
- 使用箭头函数作为事件处理器可以避免 `this` 丢失
- 对象的方法定义应该用普通函数（需要动态 `this`）

**关键洞察**：箭头函数查找 `this` 时，对象字面量 `{}` 不会创建 `this` 作用域，会继续向外找到全局作用域。

### 2. 解构赋值的灵活应用

- **对象解构**：变量名必须与属性名一致，可重命名和设置默认值
- **数组解构**：按位置匹配，变量名可以任意取

在 React 中的典型应用：
- Props 解构：`function UserCard({ name, age }) { ... }`
- useState 解构：`const [count, setCount] = useState(0)`

**为什么 useState 返回数组而非对象？** 数组解构允许自由命名，避免多个 state 变量冲突。

### 3. 简写规则速查

| 场景 | 箭头函数写法 |
|------|-------------|
| 单参数 | `n => n * 2` |
| 多参数 | `(a, b) => a + b` |
| 返回对象 | `() => ({ name: 'test' })` |

| 场景 | 解构语法 |
|------|----------|
| 重命名 | `{ name: userName }` |
| 默认值 | `{ email = "未填写" }` |
| 剩余元素 | `[first, ...rest]` |

## 详细学习材料

- [[learning/react/ch01-javascript-modern/00-overview|第 1 章：JavaScript 现代化]]
- [[learning/react/ch01-javascript-modern/01-arrow-functions|箭头函数]]
- [[learning/react/ch01-javascript-modern/02-destructuring|解构赋值]]

## 后续计划

- [ ] 继续完成第 1 章剩余内容（展开运算符、模板字符串、async/await）
- [ ] 完成 playground 中的练习题并通过测试
