---
title: 第 1 章总结
chapter: 01
section: 99
type: chapter-summary
status: 未开始
progress:
  started_at: null
  completed_at: null
  mastery: null
tags:
  - learning/react/ch01
  - tech/javascript
  - tech/es6
---

# 第 1 章总结

> 回顾 JavaScript 现代化特性，巩固 React 开发基础

---

## 🎯 核心要点回顾

### 箭头函数

- 简洁的函数语法：`(a, b) => a + b`
- `this` 由定义位置决定，不由调用方式决定
- 适合用作回调函数和事件处理器

### 解构赋值

- 对象解构：`const { name, age } = user`
- 数组解构：`const [first, second] = array`
- React 中：Props 解构、useState 返回值解构

### 展开运算符

- 数组展开：`[...arr1, ...arr2]`
- 对象展开：`{ ...obj1, ...obj2 }`
- React 状态不可变更新的核心

### 模板字符串

- 反引号语法：`` `Hello, ${name}!` ``
- 支持多行字符串

### async/await

- 用同步写法处理异步：`const data = await fetchData()`
- 错误处理：try/catch

### ES6 模块化

- 导出：`export` / `export default`
- 导入：`import { xxx } from` / `import xxx from`

### 数组高阶方法

- `map`：转换数组
- `filter`：过滤数组
- `reduce`：聚合数组
- React 列表渲染的核心

### 可选链和空值合并

- 可选链：`obj?.prop?.nested`
- 空值合并：`value ?? defaultValue`

---

## 📝 综合练习

### 练习 1：数据处理

给定以下用户数据，完成要求的操作：

```javascript
const users = [
  { id: 1, name: "Alice", age: 25, active: true },
  { id: 2, name: "Bob", age: 30, active: false },
  { id: 3, name: "Charlie", age: 28, active: true },
  { id: 4, name: "Diana", age: 22, active: true }
];
```

1. 筛选出活跃用户
2. 提取活跃用户的名字
3. 计算活跃用户的平均年龄

### 练习 2：模拟 React 组件

使用本章学到的所有特性，编写一个模拟的用户列表组件：

```javascript
// 要求：
// 1. 使用解构获取 props
// 2. 使用 async/await 获取用户数据
// 3. 使用 map 渲染用户列表
// 4. 使用可选链安全访问用户属性
// 5. 使用箭头函数处理点击事件
```

---

## 🧪 章节测验

### Q1: 综合题

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

输出是什么？

> [!success]- 查看答案
> **答案：`["Alice - Beijing"]`**
>
> - `filter` 使用可选链 `u.profile?.city`，Bob 的 profile 是 null，所以 `null?.city` 返回 undefined，被过滤掉
> - `map` 只处理 Alice，使用模板字符串拼接

---

## ✅ 完成检查清单

- [ ] 所有 8 节内容学习完成
- [ ] 每节练习完成
- [ ] 每节测验正确率 > 80%
- [ ] 综合练习完成

---

## 🔗 下一步

恭喜完成第 1 章！

你已经掌握了 React 开发所需的 JavaScript 基础。接下来，我们将正式进入 React 的世界！

→ [[../ch02-react-basics/00-overview|第 2 章：React 基础概念]]
