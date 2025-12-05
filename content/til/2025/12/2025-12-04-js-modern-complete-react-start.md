---
type: til
date: 2025-12-04
topics:
  - JavaScript 现代化
  - React 基础
learning_series: React 学习系列
chapters_completed:
  - ch01-07
  - ch01-08
  - ch01-99
  - ch02-01
  - ch02-02
tags:
  - record/til
  - tech/javascript
  - tech/react
  - tech/jsx
---

# 今日学习：完成 JS 现代化，开启 React 之旅

## 学习概要

今天是一个里程碑式的学习日！完成了 **JavaScript 现代化** 章节的最后两节内容和章节总结，正式结束了第 1 章的学习。紧接着，开启了 **React 基础概念** 的学习，完成了前两节：React 核心理念和 JSX 语法。

学习强度较大，但内容衔接紧密——JS 现代语法正是 React 开发的基石，从 `map`/`filter` 到列表渲染，从 `?.`/`??` 到安全访问 props，一切都串联起来了。

---

## 核心收获

### 1. 数组高阶方法（ch01-07）

掌握了 React 数据处理的核心工具：

- **map** — 一对一转换，React 列表渲染的基础
- **filter** — 筛选数据，条件过滤的利器
- **reduce** — 最强大的聚合方法，可实现分组、计数、建索引

**口诀记忆**：
- `map`：🍎🍊🍋 → 🧃🧃🧃（转换）
- `filter`：🍎🍊🍋 → 🍎（筛选）
- `reduce`：🍎🍊🍋 → 🥗（聚合）

**重要陷阱**：`map` 返回新数组，但数组里的对象仍是同一引用！要用 `{ ...obj }` 创建新对象。

### 2. 可选链和空值合并（ch01-08）

ES2020 的两个语法糖，在 React 中处理异步数据和可选 props 时极其常用：

| 运算符 | 用途 | 记忆点 |
|--------|------|--------|
| `?.` | 安全访问属性/方法/索引 | "问一问再访问" |
| `??` | 只为 null/undefined 提供默认值 | "双问号只问空" |
| `\|\|` | 为所有 falsy 值提供默认值 | "单竖线管得宽" |

**典型模式**：`user?.profile?.name ?? "访客"`

### 3. React 核心理念（ch02-01）

理解了 React 的四大核心概念：

| 理念 | 一句话解释 |
|------|-----------|
| **声明式** | 描述"结果是什么"，不关心"怎么做到" |
| **组件化** | UI 拆成独立、可复用的组件 |
| **单向数据流** | 数据从父到子流动，变化可追踪 |
| **虚拟 DOM** | 高效更新，只改变真正需要变的部分 |

**核心公式**：`UI = f(state)`

### 4. JSX 语法（ch02-02）

JSX 的本质是 `React.createElement()` 的语法糖：

- `{}` 是 JSX 通往 JavaScript 的窗口，只能放**表达式**
- `className` 代替 `class`，`htmlFor` 代替 `for`
- `style` 必须是对象：`style={{ color: 'red' }}`
- 多行 JSX 用括号包裹，避免自动分号插入

**速记**：
- 字符串 → `"value"`
- 数字/变量/函数 → `{value}`
- 对象（如 style）→ `{{ key: value }}`

---

## 详细学习材料

- [[learning/react/ch01-javascript-modern/07-array-methods|数组高阶方法]]
- [[learning/react/ch01-javascript-modern/08-optional-chaining|可选链和空值合并]]
- [[learning/react/ch01-javascript-modern/99-summary|第 1 章总结]]
- [[learning/react/ch02-react-basics/01-what-is-react|React 是什么]]
- [[learning/react/ch02-react-basics/02-jsx-syntax|JSX 语法]]

---

## 后续计划

- [ ] 继续 React 基础：函数组件（ch02-03）
- [ ] Props 属性传递（ch02-04）
- [ ] 完成第 2 章的练习和测试
