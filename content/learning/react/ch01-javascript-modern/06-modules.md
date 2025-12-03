---
title: ES6 模块化
chapter: 01
section: 06
status: 已完成
progress:
  started_at: 2025-12-03
  completed_at: 2025-12-03
  time_spent: "30min"
  mastery: 熟悉
tags:
  - learning/react/ch01
  - tech/javascript
  - tech/es6
---

# ES6 模块化

> 组织和复用代码的标准方式——React 组件导入导出的基础

---

## 📋 学习目标

- [x] 理解 ES6 模块化的概念
- [x] 掌握命名导出和默认导出
- [x] 掌握命名导入和默认导入
- [x] 理解模块的重导出（re-export）
- [x] 了解动态导入的使用场景

---

## 📖 知识点

### 1. 为什么需要模块化

早期 JavaScript 没有模块系统，所有代码都在全局作用域：

```html
<!-- 顺序必须正确，否则报错 -->
<script src="utils.js"></script>
<script src="api.js"></script>
<script src="app.js"></script>
```

**问题**：
- **命名冲突**：不同文件定义同名变量会互相覆盖
- **依赖不清晰**：不知道哪个文件依赖哪个
- **加载顺序敏感**：顺序错了就崩溃

ES6 模块化解决了这些问题——每个文件都是独立的**模块**，有自己的作用域。

---

### 2. 导出（export）

ES6 有两种导出方式：**命名导出**和**默认导出**。

#### 2.1 命名导出（Named Export）

```javascript
// utils.js

// 方式 1：声明时导出
export const PI = 3.14159;

export function add(a, b) {
  return a + b;
}

export class Calculator {
  // ...
}

// 方式 2：统一导出（推荐，清晰）
const PI = 3.14159;
function add(a, b) { return a + b; }
class Calculator { }

export { PI, add, Calculator };
```

#### 2.2 默认导出（Default Export）

```javascript
// UserService.js
export default class UserService {
  getUser(id) { /* ... */ }
}
```

> [!important] 导出数量限制
> - **命名导出**：可以有任意多个
> - **默认导出**：最多只能有一个（`default` 就像"主角"）

---

### 3. 导入（import）

导入方式要和导出方式**配对**使用。

#### 3.1 命名导入

```javascript
// 导入特定的导出项（名字必须匹配）
import { PI, add } from './utils.js';

// 重命名（解决命名冲突）
import { add as addNumbers } from './utils.js';

// 导入全部（放到一个对象里）
import * as Utils from './utils.js';
console.log(Utils.PI);       // 3.14159
console.log(Utils.add(1, 2)); // 3
```

#### 3.2 默认导入

```javascript
// 名字可以随便起！
import UserService from './UserService.js';
import US from './UserService.js';  // 也行
```

#### 3.3 混合导入

```javascript
// React 就是这样导出的
import React, { useState, useEffect } from 'react';
//     ↑默认导出   ↑命名导出
```

---

### 4. 与 Java 对比

| Java | ES6 Module |
|------|------------|
| `import com.example.User;` | `import User from './User.js';` |
| `import static Math.PI;` | `import { PI } from './math.js';` |
| `import java.util.*;` | `import * as Util from './util.js';` |
| 自动查找 classpath | 必须写明确路径（`./`、`../`、包名） |

> [!warning] 关键区别
> - Java 的 `import` 只是告诉编译器去哪找类，不影响运行时
> - ES6 的 `import` 是**真正加载并执行**模块代码

---

### 5. 重导出（Re-export）

把多个模块的内容"汇总"到一个入口文件：

```javascript
// components/Button.js
export const Button = () => { /* ... */ };

// components/Input.js
export const Input = () => { /* ... */ };

// components/index.js（入口文件）
export { Button } from './Button.js';
export { Input } from './Input.js';

// 或者全部重导出
export * from './Button.js';
export * from './Input.js';
```

使用时从一个地方导入：

```javascript
// 不用重导出：要写多行
import { Button } from './components/Button.js';
import { Input } from './components/Input.js';

// 用重导出：一行搞定
import { Button, Input } from './components';
```

> [!tip] React 项目常见模式
> `index.js` 作为目录的入口文件，汇总导出该目录下的所有组件。

---

### 6. 动态导入

前面的都是**静态导入**——在文件顶部、编译时确定。

**动态导入**在运行时按需加载：

```javascript
// 静态导入：总是加载
import { heavyModule } from './heavy.js';

// 动态导入：需要时才加载（返回 Promise）
async function loadOnDemand() {
  if (needHeavyFeature) {
    const { heavyModule } = await import('./heavy.js');
    heavyModule.doSomething();
  }
}
```

**React 中的应用**——路由懒加载：

```javascript
// 用户访问 /admin 时才加载 AdminPage
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
```

---

## ⚠️ 常见错误

### 错误 1：命名导入写错名字

```javascript
// utils.js
export const add = (a, b) => a + b;

// app.js
import { Add } from './utils.js';  // ❌ 报错！大小写敏感
import { add } from './utils.js';  // ✅
```

### 错误 2：混淆默认导入和命名导入

```javascript
// UserService.js
export default class UserService { }

// app.js
import { UserService } from './UserService.js';  // ❌ 报错！
import UserService from './UserService.js';       // ✅
```

### 错误 3：忘记相对路径

```javascript
import { Button } from 'components/Button';   // ❌ 会去 node_modules 找
import { Button } from './components/Button'; // ✅ 本地文件要加 ./
```

---

## 💡 导入语法 vs 解构语法

命名导入的 `{ }` 语法**看起来像**对象解构，但有区别：

```javascript
// 对象解构：右边可以是任意表达式
const { a, b } = someObject;

// 模块导入：右边必须是字符串路径
import { useState } from 'react';
import { useState } from someVar;  // ❌ 语法错误！
```

可以把命名导出理解为一个"命名空间"，按名字取东西：

```javascript
// 这两种写法效果相同
import { useState } from 'react';

import * as ReactAll from 'react';
const useState = ReactAll.useState;
```

---

## ✏️ 练习

模块化需要多文件配合，练习位于 `06-modules/` 目录下：

| 练习 | 文件 | 任务 |
|------|------|------|
| 1 | [math-utils.ts](idea://open?file=/Users/linqibin/Desktop/Patra/patra-react-playground/src/exercises/ch01/06-modules/math-utils.ts) | 命名导出 |
| 2 | [calculator.ts](idea://open?file=/Users/linqibin/Desktop/Patra/patra-react-playground/src/exercises/ch01/06-modules/calculator.ts) | 默认导出 |
| 3 | [index.ts](idea://open?file=/Users/linqibin/Desktop/Patra/patra-react-playground/src/exercises/ch01/06-modules/index.ts) | 重导出 |
| 参考 | [string-utils.ts](idea://open?file=/Users/linqibin/Desktop/Patra/patra-react-playground/src/exercises/ch01/06-modules/string-utils.ts) | 已完成示例 |

**验证命令**：`pnpm test 06-modules`

> [!tip] 练习顺序
> 按 1 → 2 → 3 的顺序完成，练习 3 的重导出依赖前两个练习的导出。

---

## 🧪 测验

1. **一个模块最多可以有几个默认导出？**

> [!note]- 答案
> 最多 1 个。默认导出用 `export default`，一个模块只能有一个"默认"。

2. **下面的导入语句有什么问题？**

```javascript
// math.js
export const PI = 3.14;

// app.js
import PI from './math.js';
```

> [!note]- 答案
> `PI` 是命名导出，不是默认导出。应该用 `import { PI } from './math.js';`

3. **React 的 `import React, { useState } from 'react'` 中，哪个是默认导出？**

> [!note]- 答案
> `React` 是默认导出，`useState` 是命名导出。混合导入时，默认导出写在前面，命名导出用 `{ }` 包裹。

---

## 🔗 导航

- 上一节：[[05-async-await|async/await]]
- 下一节：[[07-array-methods|数组高阶方法]]
