---
title: 函数组件
chapter: 02
section: 03
status: 已完成
progress:
  started_at: 2025-12-05
  completed_at: 2025-12-05
  mastery: 熟悉
tags:
  - learning/react/ch02
  - tech/react
  - tech/component
---

# 函数组件

> 组件是 React 应用的原子单位，函数组件是最简洁的组件形式——接收数据，返回 UI。

---

## 📋 学习目标

- [x] 理解组件的概念（UI 的构建块）
- [x] 掌握函数组件的语法和命名规范
- [x] 学会组件的组合与嵌套
- [x] 理解组件复用的价值

---

## 📖 核心概念

### 1. 什么是组件？

**组件是 React 应用的原子单位**，就像乐高积木，整个 UI 由一块块组件拼接而成。

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   组件 = 函数                                                │
│                                                             │
│   输入：props（数据）  ──────→  输出：JSX（UI）              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**与 Java 的类比**：

| Java 概念 | React 概念 | 相似点 |
|-----------|-----------|--------|
| `class UserDTO` | `function UserCard()` | 定义一个可复用的结构 |
| `new UserDTO()` | `<UserCard />` | 使用这个结构 |
| 构造函数参数 | Props | 传入数据 |
| 返回 JSON | 返回 JSX | 产出结果 |

---

### 2. 函数组件语法

```tsx
// 方式 1：function 声明（React 官方文档风格）
function Greeting() {
  return <h1>Hello, React!</h1>;
}

// 方式 2：箭头函数 + const
const Greeting = () => {
  return <h1>Hello, React!</h1>;
};

// 方式 3：箭头函数 + 隐式返回（仅适合简单组件）
const Greeting = () => <h1>Hello, React!</h1>;
```

> [!tip] 选择建议
> 三种写法功能等价，团队一致性比个人偏好更重要。学习阶段建议用 `function` 声明，与官方文档保持一致。

---

### 3. 命名规范（必须遵守！）

**组件名必须大写开头（PascalCase）**：

```tsx
// ✅ 正确：PascalCase
function UserCard() { ... }
function ShoppingCart() { ... }

// ❌ 错误：小写开头
function userCard() { ... }  // React 会把它当成 HTML 标签！
```

**原理**：JSX 编译时根据首字母大小写区分组件和 HTML 标签：

```tsx
// 大写 → 编译成变量引用
<Greeting />  →  React.createElement(Greeting, null)

// 小写 → 编译成字符串
<greeting />  →  React.createElement('greeting', null)
```

> [!warning] 我踩过的坑
> 小写组件名会被当作未知 HTML 标签，渲染出空的 `<greeting></greeting>`，不会报错但也不会显示内容！

---

### 4. 组件组合与嵌套

React 的核心思想：**通过组合简单组件构建复杂 UI**。

```tsx
// 基础组件
function Logo() {
  return <span>🚀 Patra</span>;
}

function NavMenu() {
  return <nav>首页 | 产品 | 关于</nav>;
}

// 组合组件
function Header() {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Logo />      {/* 使用 Logo 组件 */}
      <NavMenu />   {/* 使用 NavMenu 组件 */}
    </header>
  );
}
```

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
│  ├── Logo         (🚀 Patra)                                │
│  └── NavMenu      (首页 | 产品 | 关于)                       │
└─────────────────────────────────────────────────────────────┘
```

**组件拆分原则**：
- **单一职责** —— 一个组件只做一件事
- **复用潜力** —— 会被多处使用的部分独立出来
- **复杂度隔离** —— 逻辑复杂的部分独立出来
- **适度拆分** —— 不必为了拆而拆

---

### 5. 组件复用

**同一组件 + 不同数据 = 不同 UI**，这就是复用性。

```tsx
function Badge(props: { text: string; color: string }) {
  return (
    <span style={{ backgroundColor: props.color, color: 'white' }}>
      {props.text}
    </span>
  );
}

// 一次定义，多处复用
<Badge text="新品" color="green" />
<Badge text="促销" color="red" />
<Badge text="限量" color="purple" />
```

这就像 Java 的类实例化：

```java
// Java：一次定义，多次实例化
new Badge("新品", "green");
new Badge("促销", "red");
```

---

### 6. Props 初印象

Props 是组件的输入参数，类似 Java 构造函数参数：

```tsx
// 定义：声明需要什么参数
function Avatar(props: { src: string; size?: number }) {
  const size = props.size || 64;
  return <img src={props.src} width={size} height={size} />;
}

// 使用：传入参数
<Avatar src="avatar.jpg" size={40} />
```

**关键特性**：
- Props 是**只读**的，组件不能修改自己的 props
- 这保证了**单向数据流**的可预测性

> [!note] 下一节详解
> Props 的完整用法（类型定义、默认值、children 等）将在下一节深入学习。

---

## ⚠️ 易错点

### 1. 语义化标签

```tsx
// ❌ 虽然能工作，但语义不对
function PageHeader() {
  return <div>...</div>;
}

// ✅ 使用语义化标签
function PageHeader() {
  return <header>...</header>;
}
```

HTML5 语义化标签（`<header>`, `<nav>`, `<main>`, `<footer>` 等）对 SEO 和无障碍访问很重要。

### 2. JSX 表达式 vs 模板字符串

```tsx
// ❌ 错误：在 JSX 中使用了模板字符串语法
<p>¥${price}</p>  // 显示：¥$299

// ✅ 正确：JSX 表达式直接用 {}
<p>¥{price}</p>   // 显示：¥299
```

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  模板字符串（JS 中）     JSX 表达式（JSX 中）                 │
│  ─────────────────     ─────────────────                   │
│  `¥${price}`           ¥{price}                            │
│   ↑                     ↑                                  │
│   反引号 + ${}          直接 {}，不需要 $                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 核心公式

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│           函数组件 = 接收 props，返回 JSX                     │
│                                                             │
│           组件名必须 PascalCase                              │
│                                                             │
│           复用 = 同一组件 + 不同 props                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✏️ 练习

完成练习并运行测试验证：

| 练习文件 | 验证命令 |
|----------|----------|
| [02-function-components.tsx](idea://open?file=/Users/linqibin/Desktop/Patra/patra-react-playground/src/exercises/ch02/02-function-components.tsx) | `pnpm test 02-function-components` |

**练习内容**：
1. 基本组件语法（`Greeting`、`Farewell`）
2. 组件组合（`PageHeader`）
3. 组件嵌套（`Logo` + `NavMenu` + `Header`）
4. 可复用组件（`Badge`）
5. 综合练习（`ProductCard` 系统）

**完成状态**：✅ 36/36 测试通过

---

## 🧪 测验

### Q1: 以下哪个是有效的 React 组件名？

- [ ] A. `userCard`
- [x] B. `UserCard`
- [ ] C. `user-card`
- [x] D. `User_Card`

> [!success]- 查看答案
> **答案：B、D**
> React 组件名必须大写开头。虽然 D 能工作，但推荐使用 PascalCase（B）。

### Q2: `<greeting />` 会被编译成什么？

- [ ] A. `React.createElement(greeting, null)`
- [x] B. `React.createElement('greeting', null)`
- [ ] C. 报错
- [ ] D. `React.createElement(Greeting, null)`

> [!success]- 查看答案
> **答案：B**
> 小写开头会被当作 HTML 标签，编译成字符串 `'greeting'`。

### Q3: 以下代码显示什么？

```tsx
const price = 99;
return <p>¥${price}</p>;
```

- [ ] A. `¥99`
- [x] B. `¥$99`
- [ ] C. `¥${price}`
- [ ] D. 报错

> [!success]- 查看答案
> **答案：B**
> 在 JSX 文本中，`$` 是普通字符，`{price}` 是表达式。所以显示 `¥$99`。正确写法是 `¥{price}`。

---

## 🔗 导航

- 上一节：[[02-jsx-syntax|JSX 语法]]
- 下一节：[[04-props|Props 属性传递]]
