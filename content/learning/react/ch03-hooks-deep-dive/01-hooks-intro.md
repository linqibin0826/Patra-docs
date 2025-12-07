---
title: Hooks 入门
chapter: 3
section: 1
status: 已完成
progress:
  started_at: 2025-12-07
  completed_at: 2025-12-07
  time_spent: "1h"
  mastery: 熟悉
tags:
  - learning/react/ch03
  - tech/react
  - tech/hooks
---

# Hooks 入门

> Hooks 让函数组件能够「钩入」React 的内部能力——状态、生命周期、上下文等

---

## 📋 学习目标

- [x] 理解 Hook 的本质：为函数组件提供「钩入」React 能力的机制
- [x] 掌握 Hooks 的两条核心规则及其原因
- [x] 能够区分 Hook 调用和 setter 调用
- [x] 学会用「Map 模式」管理列表元素的独立状态

---

## 📖 核心概念

### 1. 什么是 Hook？

函数组件本质上就是一个**普通函数**——每次调用都是全新的执行，没有记忆，没有生命周期。

```tsx
// 普通函数，每次调用 count 都重置为 0
function Counter() {
  let count = 0;
  return <button>{count}</button>;
}
```

**Hook = 钩入 React 的能力**

```d2
direction: down

react: React 内部机制 {
  style.fill: "#e3f2fd"

  state: 状态 { style.fill: "#bbdefb" }
  lifecycle: 生命周期 { style.fill: "#bbdefb" }
  context: 上下文 { style.fill: "#bbdefb" }
}

hooks: Hooks {
  style.fill: "#fff3e0"

  useState { style.fill: "#ffe0b2" }
  useEffect { style.fill: "#ffe0b2" }
  useContext { style.fill: "#ffe0b2" }
}

component: 你的函数组件 {
  style.fill: "#e8f5e9"
}

react.state -> hooks.useState: 🪝 {
  style.stroke: "#1976d2"
}
react.lifecycle -> hooks.useEffect: 🪝 {
  style.stroke: "#1976d2"
}
react.context -> hooks.useContext: 🪝 {
  style.stroke: "#1976d2"
}

hooks -> component: 提供能力 {
  style.stroke: "#388e3c"
  style.stroke-width: 2
}
```

> [!tip] Java 类比
> 想象函数组件是一个 `static` 方法，本身不能有实例变量。Hooks 就像给这个静态方法开了一个后门，让它能「钩入」类似 Spring 容器的能力——获取状态（`@Autowired`）、响应生命周期（`@PostConstruct`）等。

### 2. Hooks 分类全景图

| 分类 | Hook | 「钩入」的能力 | 学习状态 |
|------|------|---------------|---------|
| **状态** | `useState` | 组件状态 | ✅ 已学 |
| **副作用** | `useEffect` | 生命周期 & 外部系统 | 下一节 |
| **引用** | `useRef` | DOM 元素 / 可变值 | 待学习 |
| **上下文** | `useContext` | 跨组件共享 | 待学习 |
| **性能** | `useMemo` / `useCallback` | 缓存机制 | 待学习 |
| **状态机** | `useReducer` | 复杂状态逻辑 | 后续补充 |

---

## 🚨 Hooks 的两条规则

### 规则一：只在顶层调用 Hooks

```tsx
// ❌ 错误：在条件语句中调用
if (loggedIn) {
  const [user, setUser] = useState(null);
}

// ❌ 错误：在循环中调用
for (let i = 0; i < 3; i++) {
  useEffect(() => {});
}

// ✅ 正确：在函数组件顶层调用
function MyComponent() {
  const [user, setUser] = useState(null);  // 顶层 ✅
  const [items, setItems] = useState([]);  // 顶层 ✅

  if (user) {
    // 可以在这里使用 user，但不能调用新的 Hook
  }
}
```

### 规则二：只在 React 函数中调用

Hooks 只能在**函数组件**或**自定义 Hook** 中调用，不能在普通函数或组件外部调用。

```tsx
// ❌ 错误：在组件外部调用
const globalState = useState(0);

// ✅ 正确：在函数组件内调用
function MyComponent() {
  const [state, setState] = useState(0);
}
```

### 为什么有这些规则？

**关键点**：React 通过**调用顺序（索引）**来匹配每个 Hook 对应的状态值。

```
React 内部存储（类似数组）：
┌─────────────────────────────────────┐
│  索引 0  │  索引 1    │  索引 2     │
│  count   │  name      │  age        │
│  值: 0   │  值: Alice │  值: 25     │
└─────────────────────────────────────┘
```

如果在条件语句中调用 Hook，不同渲染时调用顺序可能不同，导致**状态错乱**：

| 渲染 | 第 1 个 Hook | 第 2 个 Hook | 第 3 个 Hook |
|------|-------------|-------------|-------------|
| `showMessage=true` | count | message | step |
| `showMessage=false` | count | step ← 拿到了 message 的值！ | ❌ |

> [!important] 约定优于配置
> React 选择了「简单的规则 + 约束开发者」的方案。只要遵守规则，一切都很简单。ESLint 插件会自动检测违规。

---

## 🎯 重要模式：Map 模式管理列表状态

当需要为列表中每个元素维护**独立状态**时，不能在循环中调用 Hook。

```tsx
// ❌ 错误：在循环中调用 useState
items.map((item) => {
  const [checked, setChecked] = useState(false);  // 违反规则！
});

// ✅ 正确：用 Map/Record 统一管理
const [checkedMap, setCheckedMap] = useState<Record<number, boolean>>({});

items.map((item) => (
  <input
    type="checkbox"
    checked={checkedMap[item.id] ?? false}
    onChange={() => setCheckedMap(prev => ({
      ...prev,
      [item.id]: !prev[item.id]
    }))}
  />
));
```

> [!tip] Java 类比
> 这和 Java 中使用 `Map<Integer, Boolean>` 来管理多个 ID 的状态是一样的思路。

---

## ⚠️ 易错点

### 1. 区分 Hook 调用和 setter 调用

```tsx
// useState 是 Hook ← 必须在顶层调用
const [count, setCount] = useState(0);

// setCount 是 setter ← 可以在任何地方调用
if (count > 5) {
  setCount(0);  // ✅ 这不是 Hook 调用
}
```

### 2. 渲染过程中不能调用 setState

```tsx
// ❌ 错误：在渲染中调用 setState → 无限循环！
const renderedItems = items.map((item) => {
  setCheckedMap(prev => ({ ...prev, [item.id]: false }));
  return <li>{item.text}</li>;
});

// 渲染 → setState → 重新渲染 → setState → ... 💥
```

---

## ✏️ 练习

| 练习文件 | 验证命令 |
|----------|----------|
| [01-hooks-rules.tsx](idea://open?file=/Users/linqibin/Desktop/Patra/patra-react-playground/src/exercises/ch03/01-hooks-rules.tsx) | `pnpm test 01-hooks-rules` |

**练习内容**：
- 练习 1：判断代码是否违反 Hooks 规则
- 练习 2A：修复条件调用问题
- 练习 2B：用 Map 模式管理列表状态
- 练习 3：理解调用顺序导致的状态错乱

**完成状态**：✅ 13/13 测试通过

---

## 🔗 导航

- 上一节：[[00-overview|第 3 章概述]]
- 下一节：[[02-useeffect-basics|useEffect 基础]]
