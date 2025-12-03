---
title: 解构赋值
chapter: 01
section: 02
status: 已完成
progress:
  started_at: 2025-12-02
  completed_at: 2025-12-02
  mastery: 熟悉
tags:
  - learning/react/ch01
  - tech/javascript
  - tech/es6
---

# 解构赋值

> 从对象和数组中快速提取值——React 中最常用的语法之一

---

## 📋 学习目标

- [x] 掌握对象解构的基本语法
- [x] 掌握数组解构的基本语法
- [x] 理解解构时的重命名和默认值
- [x] 在 React 中正确使用解构（Props、useState）

---

## 📖 知识点

### 1. 对象解构

#### 基础语法

```javascript
const user = { name: "小明", age: 25, city: "北京" };

// 传统方式
const name = user.name;
const age = user.age;

// 解构方式
const { name, age, city } = user;
```

**关键**：变量名必须和对象的属性名一致。

#### 重命名

```javascript
const { name: userName, city: location } = user;
// userName = "小明", location = "北京"
```

**语法**：`{ 原属性名: 新变量名 }`

#### 默认值

```javascript
const { email = "未填写" } = user;
// email = "未填写"（user 中不存在 email）
```

#### 组合：重命名 + 默认值

```javascript
const { email: userEmail = "未填写" } = user;
```

---

### 2. 数组解构

#### 基础语法

```javascript
const colors = ["red", "green", "blue"];
const [first, second] = colors;
// first = "red", second = "green"
```

**关键**：数组解构按**位置**匹配，变量名可以任意取。

#### 跳过元素

```javascript
const [, , third] = colors;
// third = "blue"
```

#### 剩余元素（Rest）

```javascript
const [first, ...rest] = colors;
// first = "red", rest = ["green", "blue"]
```

#### 默认值

```javascript
const [a, b, c, d = "默认"] = colors;
// d = "默认"
```

---

### 3. 嵌套解构

```javascript
const response = {
  data: {
    user: {
      profile: { nickname: "小明同学" }
    }
  }
};

// 嵌套解构
const { data: { user: { profile: { nickname } } } } = response;
// nickname = "小明同学"
```

> [!tip] 可读性优先
> 嵌套太深时，分步解构更清晰：
> ```javascript
> const { data } = response;
> const { user } = data;
> const { nickname } = user.profile;
> ```

---

### 4. 在 React 中的应用

#### Props 解构

```tsx
// ❌ 不解构
function UserCard(props: { name: string; age: number }) {
  return <h1>{props.name}</h1>;
}

// ✅ 参数解构
function UserCard({ name, age }: { name: string; age: number }) {
  return <h1>{name}</h1>;
}
```

#### useState 解构

```tsx
const [count, setCount] = useState(0);
```

> [!info] 为什么 useState 返回数组？
> 数组解构允许**自由命名**，避免多个 state 变量冲突：
> ```tsx
> const [count, setCount] = useState(0);
> const [name, setName] = useState("");  // 不会冲突
> ```

#### 事件对象解构

```tsx
function handleChange({ target: { value } }) {
  console.log(value);
}
```

---

## 🎯 语法速查

| 场景 | 语法 | 示例 |
|------|------|------|
| 对象解构 | `{ prop }` | `const { name } = user` |
| 重命名 | `{ prop: newName }` | `const { name: userName } = user` |
| 默认值 | `{ prop = default }` | `const { email = "无" } = user` |
| 数组解构 | `[a, b]` | `const [first, second] = arr` |
| 跳过元素 | `[, , third]` | `const [, , third] = arr` |
| 剩余元素 | `[first, ...rest]` | `const [first, ...rest] = arr` |
| 嵌套解构 | 结构对应结构 | `const { data: { id } } = response` |

---

## ✏️ 练习

完成练习并运行测试验证：

| 练习文件 | 验证命令 |
|----------|----------|
| [02-destructuring.tsx](idea://open?file=/Users/linqibin/Desktop/Patra/patra-react-playground/src/exercises/ch01/02-destructuring.tsx) | `pnpm test 02-destructuring` |

---

## 🔗 导航

- 上一节：[[01-arrow-functions|箭头函数]]
- 下一节：[[03-spread-operator|展开运算符]]
