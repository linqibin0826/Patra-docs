---
type: til
date: 2025-12-03
topics:
  - 展开运算符
  - 模板字符串
  - async/await
  - ES6 模块化
learning_series: React 学习系列
chapters_completed:
  - ch01-03
  - ch01-04
  - ch01-05
  - ch01-06
tags:
  - record/til
  - tech/javascript
  - tech/es6
  - tech/async
---

# 今日学习：JavaScript ES6 深入实践

## 学习概要

今天集中学习了 JavaScript 现代语法中最核心的四个主题：展开运算符、模板字符串、async/await 异步编程和 ES6 模块化。这些都是 React 开发的基础能力，尤其是**展开运算符**和**异步编程**在状态管理和数据获取中几乎无处不在。

通过理论学习和练习验证，对「不可变更新」和「异步执行流程」有了更清晰的认识。

## 核心收获

### 1. 展开运算符——React 不可变更新的核心

- **左收右展**：`...` 在解构左边是收集（Rest），在右边是展开（Spread）
- **浅拷贝陷阱**：展开只复制一层，嵌套对象仍是同一引用，需要逐层展开
- **React 状态更新模式**：
  - 添加：`[...todos, newTodo]`
  - 更新：`todos.map(t => t.id === id ? { ...t, done: true } : t)`
  - 删除：`todos.filter(t => t.id !== id)`

### 2. 模板字符串——所见即所得

- 反引号 + `${}` 插值，支持任意表达式
- 多行字符串原生支持，告别 `\n` 拼接
- **React 实战**：动态 className、URL 拼接，推荐配合 `clsx` 库处理条件类名

### 3. async/await——用同步写法处理异步

- **事件循环机制**：同步代码先执行完，异步回调排队等待
- **Promise 执行陷阱**：`new Promise(executor)` 中 executor 是**同步执行**，`.then()` 回调才是异步
- **await 不阻塞调用者**：函数内部暂停，但控制权立即交还
- **并行优化**：`Promise.all()` 同时发起多个请求，总耗时取决于最慢的那个

### 4. ES6 模块化——组织代码的标准方式

- **命名导出 vs 默认导出**：命名导出可多个，默认导出最多一个
- **导入必须匹配**：命名用 `{ }`，默认不用
- **重导出模式**：`index.js` 汇总导出，简化导入路径
- **动态导入**：`React.lazy(() => import('./Page'))` 实现路由懒加载

## 详细学习材料

- [[learning/react/ch01-javascript-modern/03-spread-operator|展开运算符]]
- [[learning/react/ch01-javascript-modern/04-template-literals|模板字符串]]
- [[learning/react/ch01-javascript-modern/05-async-await|async/await]]
- [[learning/react/ch01-javascript-modern/06-modules|ES6 模块化]]

## 后续计划

- [ ] 完成 Ch01 剩余章节：数组高阶方法、可选链
- [ ] 开始 Ch02 React 基础：JSX、组件、Props
