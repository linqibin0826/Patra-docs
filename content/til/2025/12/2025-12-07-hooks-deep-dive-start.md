---
type: til
date: 2025-12-07
topics: [Hooks 规则, useEffect, 闭包陷阱, 竞态条件]
learning_series: React 学习系列
chapters_completed: [ch03-section01, ch03-section02, ch03-section03]
tags:
  - record/til
  - tech/react
  - tech/hooks
  - tech/useEffect
---

# 今日学习：深入 Hooks 机制 🪝

## 学习概要

今天正式进入 React 第三章——Hooks 深入探索，完成了三个重要小节的学习。从理解 Hooks 的本质开始，到 useEffect 的基础用法，再到闭包陷阱和竞态条件这些进阶难点。总耗时约 4.5 小时，通过 34 个测试用例验证了对各概念的掌握。

这一天的学习密度很高，特别是闭包陷阱和竞态条件涉及 JavaScript 的深层机制，需要从「函数每次执行都是新的闭包」这个角度去理解。

## 核心收获

### 1. Hooks 的本质：为函数组件「钩入」能力 🎣

- **理解**：函数组件本质是无状态的普通函数，Hooks 是给它开的「后门」，让它能访问 React 的内部能力（状态、生命周期、上下文等）
- **两条铁律**：
  - 只在**顶层**调用 Hooks（不能在条件/循环中）
  - 只在 **React 函数**中调用（组件或自定义 Hook）
- **关键理解**：React 用**调用顺序（索引）**匹配 Hook 与状态，条件调用会打乱索引导致状态错乱
- **实用模式**：用 `Map/Record` 管理列表元素的独立状态，避免在循环中调用 Hook

### 2. useEffect：副作用的「隔离舱」 🚀

- **副作用 = 与渲染无关的操作**：数据获取、订阅、DOM 操作等
- **执行时机**：渲染**之后**执行，不阻塞页面显示
- **依赖数组三形态**：
  | 形态 | 行为 | 类比 |
  |------|------|------|
  | `[]` 空数组 | 只执行一次 | `@PostConstruct` |
  | `[dep]` 有依赖 | 依赖变化时执行 | 属性监听器 |
  | 不传 | 每次渲染都执行 | ⚠️ 慎用 |
- **清理函数**：在组件卸载或依赖变化前执行，用于清理定时器、取消订阅等

### 3. 闭包陷阱与解决方案 🕳️

这是今天最烧脑的部分。理解了为什么 `setInterval` 中的 `count` 永远是 `0`：

- **原因**：useEffect 回调在创建时「拍摄」了当时的 count 值，形成闭包快照
- **三种解法**：
  1. **函数式更新**：`setCount(prev => prev + 1)` — 不依赖闭包中的旧值
  2. **加入依赖**：`[count]` — 但定时器会反复重建
  3. **useRef 逃生舱**：闭包捕获 ref 对象引用，而 `.current` 可更新

### 4. 竞态条件处理 🏃

快速切换 userId 时，慢请求可能覆盖快请求的结果。解决方案：

```tsx
useEffect(() => {
  let cancelled = false;
  fetchUser(userId).then(data => {
    if (!cancelled) setUser(data);  // 只有未取消时才更新
  });
  return () => { cancelled = true };
}, [userId]);
```

## 详细学习材料

- [[learning/react/ch03-hooks-deep-dive/01-hooks-intro|Hooks 入门]] — Hook 本质、规则、Map 模式
- [[learning/react/ch03-hooks-deep-dive/02-useeffect-basics|useEffect 基础]] — 依赖数组、清理函数、执行时机
- [[learning/react/ch03-hooks-deep-dive/03-useeffect-advanced|useEffect 进阶]] — 闭包陷阱、竞态条件、useRef 逃生舱

## 关键洞见 💡

> 理解闭包陷阱的核心是：**每次渲染都创建新的函数作用域**。当你在 useEffect 中定义一个回调（如定时器），它捕获的是**当时作用域中的变量值**，而不是变量的「引用」。

这和 Java 中 lambda 捕获 effectively final 变量有相似之处，但 JavaScript 的闭包更「诚实」——它真的只捕获值的快照。

## 后续计划

- [ ] 学习 useRef 的更多用法（DOM 引用、持久化可变值）
- [ ] 深入理解 useMemo 和 useCallback 的优化场景
- [ ] 实践：用 useEffect 实现一个真实的数据获取场景
