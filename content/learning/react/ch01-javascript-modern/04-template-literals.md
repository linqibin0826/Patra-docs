---
title: 模板字符串
chapter: 01
section: 04
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

# 模板字符串

> 更优雅的字符串拼接方式——所见即所得

---

## 📋 学习目标

- [x] 掌握模板字符串的基本语法（反引号 + `${}`）
- [x] 在模板字符串中使用表达式
- [x] 处理多行字符串
- [x] 在 React 中使用模板字符串（动态 className、URL 拼接）

---

## 📖 知识点

### 1. 基本语法

> [!important] 三要素
> 1. **反引号** `` ` `` —— 不是单引号 `'`，不是双引号 `"`
> 2. **`${}`** —— 插值语法，里面可以放任何表达式
> 3. **原生多行** —— 换行直接写，不需要 `\n`

#### 与 Java 对比

| 语言 | 语法 | 示例 |
|------|------|------|
| **Java（JDK 21+）** | `STR."... \{expr} ..."` | `STR."Hello, \{name}！"` |
| **JavaScript** | `` `... ${expr} ...` `` | `` `Hello, ${name}！` `` |

---

### 2. 表达式插值

`${}` 中可以放**任何 JavaScript 表达式**：

```javascript
const name = "小明";
const age = 25;

// 变量
const intro = `我叫${name}，今年${age}岁`;

// 运算
const nextYear = `${name}明年${age + 1}岁`;

// 函数调用
const upper = `大写：${name.toUpperCase()}`;

// 三元表达式
const greeting = `${age >= 18 ? '成年人' : '未成年'}：${name}`;
```

---

### 3. 多行字符串

模板字符串最大的优势之一：**所见即所得**。

```javascript
// ✅ 模板字符串 —— 代码怎么写，输出就怎么显示
const html = `
<div class="card">
  <h1>标题</h1>
  <p>内容</p>
</div>
`;

// ❌ 传统字符串 —— 需要手动拼接 \n
const htmlOld = '<div class="card">\n' +
                '  <h1>标题</h1>\n' +
                '  <p>内容</p>\n' +
                '</div>';
```

两种写法输出相同，但模板字符串更直观、更易维护。

---

### 4. React 实战应用 ⭐

#### 动态 className

```tsx
const Button = ({ isPrimary, isLarge }) => {
  const className = `btn ${isPrimary ? 'btn-primary' : 'btn-secondary'} ${isLarge ? 'btn-lg' : ''}`;

  return <button className={className}>点击</button>;
};
```

#### 动态 URL

```tsx
const userId = 123;
const page = 2;

const apiUrl = `https://api.example.com/users/${userId}/posts?page=${page}`;
// "https://api.example.com/users/123/posts?page=2"
```

#### 消息模板

```tsx
const Notification = ({ user, action, target }) => {
  const message = `${user.name} ${action}了你的${target}`;
  // "小明 点赞了你的文章"

  return <div className="notification">{message}</div>;
};
```

---

## ⚠️ 易错点

### 1. 引号类型错误

```javascript
const name = "小明";

// ❌ 普通引号：不会解析 ${}
const wrong = "你好，${name}！";  // "你好，${name}！"

// ✅ 反引号：正确解析
const right = `你好，${name}！`;  // "你好，小明！"
```

> [!warning] 必须用反引号
> 反引号是模板字符串的"开关"，普通引号只会把 `${name}` 当作普通文本。

### 2. 多行字符串的缩进

```javascript
function render() {
  // ⚠️ 注意：模板字符串会保留所有空格和缩进
  const html = `
    <div>
      内容
    </div>
  `;
  // 输出会包含前面的空格！
}
```

如果需要精确控制缩进，可以使用 `.trim()` 或将模板字符串顶格写。

### 3. 浮点数精度问题

```javascript
const price = 99;
const quantity = 3;
const discount = 0.8;

// ❌ 直接计算会有精度问题
`折后价：${price * quantity * discount}元`
// "折后价：237.60000000000002元"

// ✅ 用 toFixed() 格式化
`折后价：${(price * quantity * discount).toFixed(1)}元`
// "折后价：237.6元"
```

> [!warning] JavaScript 浮点数陷阱
> `0.1 + 0.2 = 0.30000000000000004`！这是 IEEE 754 浮点数标准的特性。
> 处理货币时，常用 `toFixed()` 格式化显示，或用整数计算（分而不是元）。

### 4. 动态 className 的空格问题

```javascript
// 当条件为 false 时，会产生多余空格
const className = `btn ${isPrimary ? 'btn-primary' : 'btn-secondary'} ${isLarge ? 'btn-lg' : ''}`;
// isLarge=false 时："btn btn-secondary "  ← 末尾有空格

// 解决方案 1：trim()
const className = `...`.trim();

// 解决方案 2：数组 + filter + join
const className = [
  'btn',
  isPrimary ? 'btn-primary' : 'btn-secondary',
  isLarge ? 'btn-lg' : ''
].filter(Boolean).join(' ');

// 解决方案 3：clsx 库（React 社区标配）
import clsx from 'clsx';
const className = clsx('btn', {
  'btn-primary': isPrimary,
  'btn-secondary': !isPrimary,
  'btn-lg': isLarge
});
```

> [!tip] 实际项目推荐
> 使用 `clsx` 或 `classnames` 库处理动态 className，代码更清晰，自动处理空值。

---

## 🎯 语法速查

| 用法 | 语法 | 示例 |
|------|------|------|
| 变量插值 | `` `${变量}` `` | `` `我是${name}` `` |
| 表达式计算 | `` `${表达式}` `` | `` `总价：${price * qty}元` `` |
| 条件渲染 | `` `${条件 ? A : B}` `` | `` `${vip ? 'VIP' : '普通'}用户` `` |
| 多行字符串 | 直接换行 | `` `第一行`<br>`第二行` `` |
| 函数调用 | `` `${fn()}` `` | `` `大写：${str.toUpperCase()}` `` |

---

## 🔗 相关概念

- [[03-spread-operator|展开运算符]] — 上一节内容
- [[05-async-await|async/await]] — 下一节内容
- 后续章节：JSX 中的表达式 — 与模板字符串类似的 `{}` 语法

---

## ✏️ 练习

完成练习并运行测试验证：

| 练习文件 | 验证命令 |
|----------|----------|
| [04-template-literals.tsx](idea://open?file=/Users/linqibin/Desktop/Patra/patra-react-playground/src/exercises/ch01/04-template-literals.tsx) | `pnpm test 04-template-literals` |

> [!tip] 提示
> 练习包含 5 个任务：基本插值、多行字符串、表达式计算、条件表达式、动态 className。

---

## 🔗 导航

- 上一节：[[03-spread-operator|展开运算符]]
- 下一节：[[05-async-await|async/await]]
