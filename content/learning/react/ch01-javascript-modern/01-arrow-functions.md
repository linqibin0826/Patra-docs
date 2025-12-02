---
title: 箭头函数
chapter: 01
section: 01
status: 进行中
progress:
  started_at: 2025-12-02
  completed_at: null
  mastery: 熟悉
tags:
  - learning/react/ch01
  - tech/javascript
  - tech/es6
---

# 箭头函数

> 简化函数定义，解决 this 绑定问题——React 开发中最常用的 ES6 特性

---

## 📋 学习目标

- [x] 掌握箭头函数基本语法和简写形式
- [x] 理解箭头函数与普通函数的 `this` 绑定差异
- [x] 知道什么时候该用箭头函数，什么时候不该用
- [ ] 在 React 事件处理中正确使用箭头函数

---

## 📖 知识点

### 1. 基本语法

箭头函数是 ES6 引入的更简洁的函数写法，和 Java 的 Lambda 表达式非常相似。

```javascript
// 普通函数
function add(a, b) {
  return a + b;
}

// 箭头函数
const add = (a, b) => {
  return a + b;
};

// 箭头函数（简写：单表达式可省略 return 和花括号）
const add = (a, b) => a + b;
```

**Java Lambda 对比**：

```java
// Java Lambda
BinaryOperator<Integer> add = (a, b) -> a + b;
```

### 2. 简写规则

| 场景 | 写法 |
|------|------|
| 多参数 | `(a, b) => a + b` |
| 单参数 | `n => n * 2`（可省略括号） |
| 无参数 | `() => console.log('hello')` |
| 多行代码 | `(a, b) => { /* 多行 */ return result; }` |
| 返回对象 | `() => ({ name: 'test' })`（需要括号包裹） |

### 3. this 绑定——核心差异

这是箭头函数和普通函数**最重要的区别**。

| 函数类型 | `this` 绑定规则 |
|---------|----------------|
| **普通函数** | `this` 由**调用方式**决定（谁调用就指向谁） |
| **箭头函数** | `this` 由**定义位置**决定（继承外层作用域的 `this`） |

#### 示例：对象方法中的 this

```javascript
const user = {
  name: "小明",

  // 普通函数
  sayHi: function() {
    console.log("普通函数:", this.name);
  },

  // 箭头函数
  sayHello: () => {
    console.log("箭头函数:", this.name);
  }
};

user.sayHi();     // 输出: "普通函数: 小明"
user.sayHello();  // 输出: "箭头函数: undefined"
```

**为什么 `sayHello` 输出 `undefined`？**

- 箭头函数查找 `this` 时，问的是："我被写在哪个**函数**里面？"
- 对象字面量 `{}` **不是函数**，不会创建 `this` 作用域
- 所以继续向外找，找到全局作用域，`this.name` 是 `undefined`

```
┌─────────────────────────────────────────────┐
│  全局作用域  (this = window 或 undefined)    │
│                                             │
│   const user = {                            │
│     sayHi: function() {  ←─ 有自己的 this   │
│     },                                      │
│     sayHello: () => {    ←─ 没有自己的 this │
│       // 向外找 this... 跳过对象 {}...       │
│       // 找到全局作用域的 this               │
│     }                                       │
│   };                                        │
└─────────────────────────────────────────────┘
```

#### 示例：Class 中的 this

```javascript
class Button {
  constructor() {
    this.text = "点击我";
  }

  // 普通函数作为事件处理器——this 会丢失！
  handleClick() {
    console.log(this.text);  // 被 DOM 调用时，this 不是 Button 实例
  }

  // 箭头函数——this 永远指向实例
  handleClickArrow = () => {
    console.log(this.text);  // this 始终是 Button 实例
  }
}
```

**为什么 Class 中的箭头函数能正确绑定 this？**

类字段（class field）的初始化实际上是在 `constructor` 函数中执行的：

```javascript
class Button {
  handleClickArrow = () => { ... }
}

// 等价于：
class Button {
  constructor() {
    this.handleClickArrow = () => { ... };
    // ↑ 箭头函数在 constructor 内部定义
    // ↑ constructor 的 this 指向实例
    // ↑ 所以箭头函数继承到实例的 this
  }
}
```

### 4. 使用场景总结

| 场景 | 推荐写法 | 原因 |
|------|---------|------|
| 事件处理器 | 箭头函数 ✅ | 避免 `this` 丢失 |
| 数组方法回调 | 箭头函数 ✅ | 简洁 |
| 对象的方法 | 普通函数 ✅ | 需要动态 `this` |
| 需要 `arguments` | 普通函数 ✅ | 箭头函数没有 `arguments` |
| 构造函数 | 普通函数 ✅ | 箭头函数不能用作构造函数 |

---

## ✏️ 练习

练习代码：[01-arrow-functions.tsx](idea://open?file=/Users/linqibin/Desktop/Patra/patra-react-playground/src/exercises/ch01/01-arrow-functions.tsx)

### 练习 1：改写为箭头函数

将以下普通函数改写为箭头函数的最简形式：

```javascript
// 改写这些函数
function double(n) {
  return n * 2;
}

function greet(name) {
  return "Hello, " + name;
}

function sum(a, b, c) {
  return a + b + c;
}
```

### 练习 2：预测输出

```javascript
const counter = {
  count: 0,

  increment: function() {
    setTimeout(function() {
      this.count++;
      console.log(this.count);
    }, 100);
  }
};

counter.increment();
```

1. 这段代码会输出什么？
2. 如何修复这个问题？

---

## 🧪 测验

### Q1: 箭头函数的 this 指向由什么决定？

- [ ] A. 调用时的对象
- [x] B. 定义时的外层作用域
- [ ] C. 始终指向 window
- [ ] D. 始终指向 undefined

> [!success]- 查看答案
> **答案：B**
>
> 箭头函数没有自己的 `this`，它会继承定义时外层作用域的 `this`。这与普通函数（调用时决定）完全不同。

### Q2: 以下代码输出什么？

```javascript
const obj = {
  name: "test",
  getName: () => this.name
};
console.log(obj.getName());
```

- [ ] A. "test"
- [x] B. undefined
- [ ] C. 报错
- [ ] D. ""

> [!success]- 查看答案
> **答案：B**
>
> 箭头函数定义在对象字面量中，对象字面量不创建 `this` 作用域。箭头函数向外查找，找到全局作用域，`this.name` 是 `undefined`。

### Q3: 以下哪种场景不适合用箭头函数？

- [ ] A. 数组的 map 回调
- [x] B. 对象的方法定义
- [ ] C. React 的事件处理器
- [ ] D. setTimeout 的回调

> [!success]- 查看答案
> **答案：B**
>
> 对象的方法如果需要访问 `this`（指向对象本身），应该用普通函数。因为箭头函数的 `this` 不会指向对象。

---

## 🔗 导航

- 上一节：[[00-overview|章节概述]]
- 下一节：[[02-destructuring|解构赋值]]
