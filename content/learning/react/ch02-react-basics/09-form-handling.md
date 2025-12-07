---
title: 表单处理
chapter: 02
section: 09
status: 已完成
progress:
  started_at: 2025-12-06
  completed_at: 2025-12-06
  mastery: 熟悉
tags:
  - learning/react/ch02
  - tech/react
  - tech/forms
---

# 表单处理

> 表单是 Web 应用的核心交互方式。React 通过「受控组件」模式，让表单状态成为唯一数据源，实现 UI = fn(state) 的理念。

---

## 📋 学习目标

- [x] 理解受控组件的概念和工作原理
- [x] 掌握常见表单元素的受控写法
- [x] 会使用 onSubmit + preventDefault 处理表单提交
- [x] 能用对象状态 + 通用 handleChange 管理多字段表单

---

## 📖 知识点

### 1. 受控组件 (Controlled Component)

**核心理念**：让 React 状态成为表单值的「唯一数据源」。

```
┌─────────────────────────────────────────────────────────────┐
│                      受控组件数据流                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   用户输入 "a"                                               │
│        ↓                                                    │
│   onChange 触发                                             │
│        ↓                                                    │
│   setValue("a") 更新状态                                     │
│        ↓                                                    │
│   React 重新渲染                                             │
│        ↓                                                    │
│   input 显示 "a"  ←── value={state} 绑定                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**基本模式**：

```tsx
const [value, setValue] = useState('');

<input
  value={value}                              // 状态 → UI
  onChange={(e) => setValue(e.target.value)} // UI → 状态
/>
```

> [!warning] 只写 value 不写 onChange
> 输入框会「锁死」，用户无法输入任何内容。因为 React 会强制让输入框的值等于状态值。

---

### 2. 常见表单元素

| 元素类型 | 值属性 | 事件取值 |
|---------|-------|---------|
| `input[type="text"]` | `value` | `e.target.value` |
| `input[type="password"]` | `value` | `e.target.value` |
| `textarea` | `value` | `e.target.value` |
| `select` | `value` | `e.target.value` |
| `input[type="checkbox"]` | `checked` ⚠️ | `e.target.checked` ⚠️ |
| `input[type="radio"]` | `checked` ⚠️ | `e.target.value` |

> [!tip] checkbox 用 checked 不用 value
> 文本框是「填空题」→ 存字符串 → 用 `value`
> 复选框是「判断题」→ 存布尔值 → 用 `checked`

---

### 3. 表单提交

**三件套**：

```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();  // 1. 阻止页面刷新
  // 2. 处理数据（调 API 等）
};

<form onSubmit={handleSubmit}>          {/* 3. 用 form 的 onSubmit */}
  <input ... />
  <button type="submit">提交</button>
</form>
```

> [!info] 为什么用 onSubmit 而不是 onClick？
> 用户在输入框按回车键也能提交表单，更好的用户体验。

---

### 4. 多字段表单管理

当表单字段很多时，为每个字段创建一个 useState 会很冗余。更好的方式是用**对象**管理所有字段：

```tsx
// 类似 Java POJO
interface LoginForm {
  username: string;
  password: string;
}

// 用对象管理状态
const [form, setForm] = useState<LoginForm>({
  username: '',
  password: '',
});

// 通用 handleChange，靠 name 属性区分字段
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setForm(prev => ({ ...prev, [name]: value }));
};

// 每个 input 只需指定 name
<input name="username" value={form.username} onChange={handleChange} />
<input name="password" value={form.password} onChange={handleChange} />
```

**关键技术**：`[name]: value` 是 ES6 的**计算属性名**语法，可以动态设置对象的 key。

---

## 🧠 个人理解

### 与 Java 的类比

| React 表单 | Java 类比 |
|-----------|----------|
| 表单状态对象 | POJO / DTO |
| handleChange | setter 方法 |
| handleSubmit | Controller 接收请求 |
| e.preventDefault() | 类似拦截器阻止默认行为 |

### 函数式更新的好处

```tsx
// ✅ 推荐：函数式更新，基于最新状态
setForm(prev => ({ ...prev, [name]: value }));

// ⚠️ 可行但不推荐：直接引用 form
setForm({ ...form, [name]: value });
```

函数式更新更安全，尤其在快速连续更新时能保证基于最新状态。

---

## ✏️ 练习

| 练习文件 | 验证命令 |
|----------|----------|
| [exercises.tsx](idea://open?file=/Users/linqibin/Desktop/Patra/patra-react-playground/src/exercises/ch02/09-form-handling/exercises.tsx) | `pnpm test 09-form-handling` |

---

## 🔗 导航

- 上一节：[[08-list-rendering|列表渲染与 key]]
- 下一节：[[10-component-composition|组件组合与拆分]]
