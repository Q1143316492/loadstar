## 20 condition-based-waiting

> 译自 `reference/superpowers/skills/systematic-debugging/condition-based-waiting.md`（原文 115 行）。一张 dot 图与三段 TypeScript 代码块按原样保留。
> 对照 `READING-superpowers.md` 第 21 项。

**基于条件的等待（Condition-Based Waiting）**

### 20.1 概览（Overview）

不稳定（flaky）的测试常常用任意延迟去猜时机。这会制造出竞态条件：测试在快机器上通过，却在负载下或 CI 里失败。

**核心原则：** 等待你真正关心的那个条件，而不是猜它要花多久。

### 20.2 何时使用（When to Use）

```dot
digraph when_to_use {
    "Test uses setTimeout/sleep?" [shape=diamond];
    "Testing timing behavior?" [shape=diamond];
    "Document WHY timeout needed" [shape=box];
    "Use condition-based waiting" [shape=box];

    "Test uses setTimeout/sleep?" -> "Testing timing behavior?" [label="yes"];
    "Testing timing behavior?" -> "Document WHY timeout needed" [label="yes"];
    "Testing timing behavior?" -> "Use condition-based waiting" [label="no"];
}
```

**在以下情况使用：**
- 测试里有任意延迟（`setTimeout`、`sleep`、`time.sleep()`）
- 测试不稳定（有时通过，负载下失败）
- 并行运行时测试超时
- 等待异步操作完成

**不要在以下情况使用：**
- 测试真实的时序行为（防抖（debounce）、节流（throttle）间隔）
- 用了任意超时就永远要写明 WHY

### 20.3 核心模式（Core Pattern）

```typescript
// ❌ BEFORE: Guessing at timing
await new Promise(r => setTimeout(r, 50));
const result = getResult();
expect(result).toBeDefined();

// ✅ AFTER: Waiting for condition
await waitFor(() => getResult() !== undefined);
const result = getResult();
expect(result).toBeDefined();
```

### 20.4 速查模式（Quick Patterns）

| 场景 | 模式 |
|----------|---------|
| 等待事件 | `waitFor(() => events.find(e => e.type === 'DONE'))` |
| 等待状态 | `waitFor(() => machine.state === 'ready')` |
| 等待计数 | `waitFor(() => items.length >= 5)` |
| 等待文件 | `waitFor(() => fs.existsSync(path))` |
| 复合条件 | `waitFor(() => obj.ready && obj.value > 10)` |

### 20.5 实现（Implementation）

通用轮询函数：
```typescript
async function waitFor<T>(
  condition: () => T | undefined | null | false,
  description: string,
  timeoutMs = 5000
): Promise<T> {
  const startTime = Date.now();

  while (true) {
    const result = condition();
    if (result) return result;

    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Timeout waiting for ${description} after ${timeoutMs}ms`);
    }

    await new Promise(r => setTimeout(r, 10)); // Poll every 10ms
  }
}
```

完整的实现见本目录下的 `condition-based-waiting-example.ts`，其中带有来自真实调试会话的领域专用辅助函数（`waitForEvent`、`waitForEventCount`、`waitForEventMatch`）。

### 20.6 常见错误（Common Mistakes）

**❌ 轮询太快：** `setTimeout(check, 1)`——浪费 CPU
**✅ 修复：** 每 10ms 轮询一次

**❌ 没有超时：** 条件永远不满足时会无限循环
**✅ 修复：** 始终带上超时，并给出清晰的错误

**❌ 数据陈旧：** 在循环之前缓存了状态
**✅ 修复：** 在循环内部调用 getter 以获得最新数据

### 20.7 什么时候任意超时才是正确的（When Arbitrary Timeout IS Correct）

```typescript
// Tool ticks every 100ms - need 2 ticks to verify partial output
await waitForEvent(manager, 'TOOL_STARTED'); // First: wait for condition
await new Promise(r => setTimeout(r, 200));   // Then: wait for timed behavior
// 200ms = 2 ticks at 100ms intervals - documented and justified
```

**要求：**
1. 先等待触发条件
2. 基于已知的时序（不是猜）
3. 用注释解释 WHY

### 20.8 真实世界的影响（Real-World Impact）

来自一次调试会话（2025-10-03）：
- 修好了 3 个文件里 15 个不稳定测试
- 通过率：60% → 100%
- 执行时间：快了 40%
- 不再有竞态条件
