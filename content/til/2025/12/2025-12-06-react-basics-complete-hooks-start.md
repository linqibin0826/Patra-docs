---
type: til
date: 2025-12-06
topics:
  - 条件渲染
  - 列表渲染
  - 表单处理
  - 组件组合
  - React Hooks
learning_series: React
chapters_completed:
  - ch02-07
  - ch02-08
  - ch02-09
  - ch02-10
  - ch02-99
  - ch03-00
tags:
  - record/til
  - tech/react
  - tech/jsx
  - tech/hooks
---

# 今日学习：React 基础完结 + Hooks 启程

## 学习概要

今天完成了 **React 基础（第 2 章）** 的全部内容，学习了条件渲染、列表渲染与 key、表单处理、组件组合与拆分四个核心主题，并完成了章节总结。随后开启了 **React Hooks 深入（第 3 章）** 的学习，了解了 Hooks 的整体知识框架和学习路线。

这是 React 学习的一个里程碑——从「会写组件」迈向「会设计组件」，为后续 Hooks 的深入学习打下坚实基础。

## 核心收获

### 1. 条件渲染三剑客

掌握了 JSX 中条件渲染的三种方式，以及各自的适用场景：

| 方式 | 适用场景 | 示例 |
|------|----------|------|
| 三元表达式 `? :` | 二选一 | 登录/未登录 |
| 逻辑与 `&&` | 显示/隐藏 | 消息徽章 |
| 提前 return | 多分支 | 加载/错误/空/正常 |

**关键陷阱**：`&&` 的 0 陷阱——`{count && <Badge />}` 当 count 为 0 时会渲染出 `0`，正确写法是 `{count > 0 && <Badge />}`。

### 2. key 的本质：身份标识

理解了 key 不是「位置」而是「身份」：
- key 告诉 React "这是谁"，而不是 "这在哪"
- 类比学号：不管座位怎么换，学号 001 永远是同一个人
- **index 作为 key 的陷阱**：列表重排序时会导致状态错乱

**实践原则**：数据有 id 就用 id，犹豫时选 id，不要用 index。

### 3. 受控组件模式

掌握了 React 表单的核心模式——让 React 状态成为表单值的「唯一数据源」：

```tsx
const [value, setValue] = useState('');
<input value={value} onChange={e => setValue(e.target.value)} />
```

**多字段管理技巧**：用对象管理状态 + 通用 handleChange + `[name]: value` 动态键名。

### 4. 组件组合优于继承

React 组件**从不使用继承**，只使用组合：
- **children prop**：标签之间的内容自动成为 children
- **具名插槽**：多个 props 传递组件实现多插槽布局
- **容器组件 vs 展示组件**：有状态管理逻辑 vs 纯 UI 渲染

**状态提升原则**：当多个组件需要共享状态时，将状态放到最近的公共父组件中。

### 5. Hooks 知识框架

了解了第 3 章的学习路线：
- **基础篇**：Hooks 入门、useEffect 基础与进阶
- **工具篇**：useRef、useContext
- **进阶篇**：自定义 Hooks、性能优化 Hooks、模式与最佳实践

以 Java 开发者视角理解：
- `useEffect(() => {}, [])` 类似 `@PostConstruct`
- `useContext` 类似 `@Autowired` 依赖注入

## 💡 心法总结

```
UI = f(state)
React 不发明新语法，拥抱 JavaScript 本身
组合优于继承，数据向下流动，事件向上传递
```

## 详细学习材料

- [[learning/react/ch02-react-basics/07-conditional-rendering|条件渲染]]
- [[learning/react/ch02-react-basics/08-list-rendering|列表渲染与 key]]
- [[learning/react/ch02-react-basics/09-form-handling|表单处理]]
- [[learning/react/ch02-react-basics/10-component-composition|组件组合与拆分]]
- [[learning/react/ch02-react-basics/99-summary|第 2 章总结]]
- [[learning/react/ch03-hooks-deep-dive/00-overview|第 3 章概述]]

## 后续计划

- [ ] 学习 Hooks 入门，理解 Hooks 本质和调用规则
- [ ] 深入 useEffect，掌握副作用管理
- [ ] 实践自定义 Hooks，提取复用逻辑
