---
type: til
date: 2025-12-05
topics:
  - 函数组件
  - Props 属性传递
  - State 状态管理
  - 事件处理
learning_series: React 学习系列
chapters_completed:
  - ch02-03
  - ch02-04
  - ch02-05
  - ch02-06
tags:
  - record/til
  - tech/react
  - tech/hooks
  - tech/typescript
---

# 今日学习：React 基础概念强化日

## 学习概要

今天是 React 基础概念的「强化日」，一口气完成了第 2 章的四个核心小节：**函数组件、Props、State、事件处理**。这四个概念构成了 React 开发的基础骨架——组件是 UI 的构建块，Props 负责数据传入，State 负责数据存储和更新，事件处理负责响应用户交互。

学习过程中通过大量练习巩固了理解，特别是在 State 的快照原理和事件传参方面有了更深的体会。

## 核心收获

### 1. React 组件模型

组件本质上是一个函数：**输入 Props，输出 JSX**。

```
Props（数据）──→ 组件函数 ──→ JSX（UI）
```

这个模型简洁而强大，与 Java 中的纯函数思想相似。

### 2. Props vs State 的职责划分

| | Props | State |
|---|-------|-------|
| **来源** | 父组件传入 | 组件内部创建 |
| **可变性** | 只读 | 可通过 setState 更新 |
| **类比** | 函数参数 | 函数内的局部变量（持久化） |

**关键理解**：Props 是数据的「入口」，State 是数据的「记忆」。

### 3. State 快照原理

这是今天最重要的概念突破：

```tsx
// 一次渲染中，state 是固定的快照
setCount(count + 1);  // 请求更新为 1
setCount(count + 1);  // 还是请求更新为 1（不是 2！）
```

**解决方案**：使用函数式更新 `setCount(prev => prev + 1)`

### 4. 事件处理的核心模式

```tsx
// ✅ 正确：传递函数引用
onClick={() => handler(id)}

// ❌ 错误：立即调用
onClick={handler(id)}
```

掌握了三个关键方法：
- `event.target.value` - 获取输入值
- `event.preventDefault()` - 阻止默认行为
- `event.stopPropagation()` - 阻止事件冒泡

### 5. 不可变更新原则

React 通过**引用比较**检测状态变化，所以更新对象/数组时必须返回新引用：

```tsx
// ❌ 直接修改
user.age = 19;

// ✅ 创建新对象
setUser({ ...user, age: 19 });
```

## 详细学习材料

- [[learning/react/ch02-react-basics/03-function-components|函数组件]]
- [[learning/react/ch02-react-basics/04-props|Props 属性传递]]
- [[learning/react/ch02-react-basics/05-state-usestate|State 状态管理]]
- [[learning/react/ch02-react-basics/06-event-handling|事件处理]]

## 后续计划

- [ ] 学习条件渲染（ch02-07）
- [ ] 学习列表渲染与 key（ch02-08）
- [ ] 完成第 2 章剩余内容
