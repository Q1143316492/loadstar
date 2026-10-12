## 19 defense-in-depth

> 译自 `reference/superpowers/skills/systematic-debugging/defense-in-depth.md`（原文 122 行）。全部代码块按原样保留。
> 对照 `READING-superpowers.md` 第 20 项。
> 原文无 YAML frontmatter。

**纵深防御式校验（Defense-in-Depth Validation）**

### 19.1 概览（Overview）

当你修复一个由无效数据引起的缺陷时，只在一处加上校验会显得已经足够了。但那一道检查可能被不同的代码路径、重构或 mock 绕过。

**核心原则：** 在数据流经的**每一层**都做校验。让这个缺陷在结构上不可能发生。

### 19.2 为什么需要多层（Why Multiple Layers）

单一校验：“我们修好了这个缺陷”
多层校验：“我们让这个缺陷不可能发生”

不同的层捕捉不同的情况：
- 入口校验捕捉大多数缺陷
- 业务逻辑捕捉边界情况
- 环境防护阻止特定上下文中的危险
- 调试日志在其他层失效时提供帮助

### 19.3 四层（The Four Layers）

#### 19.3.1 第 1 层：入口点校验（Layer 1: Entry Point Validation）
**目的：** 在 API 边界拒绝明显无效的输入

```typescript
function createProject(name: string, workingDirectory: string) {
  if (!workingDirectory || workingDirectory.trim() === '') {
    throw new Error('workingDirectory cannot be empty');
  }
  if (!existsSync(workingDirectory)) {
    throw new Error(`workingDirectory does not exist: ${workingDirectory}`);
  }
  if (!statSync(workingDirectory).isDirectory()) {
    throw new Error(`workingDirectory is not a directory: ${workingDirectory}`);
  }
  // ... proceed
}
```

#### 19.3.2 第 2 层：业务逻辑校验（Layer 2: Business Logic Validation）
**目的：** 确保数据对这次操作而言是合理的

```typescript
function initializeWorkspace(projectDir: string, sessionId: string) {
  if (!projectDir) {
    throw new Error('projectDir required for workspace initialization');
  }
  // ... proceed
}
```

#### 19.3.3 第 3 层：环境防护（Layer 3: Environment Guards）
**目的：** 阻止特定上下文中的危险操作

```typescript
async function gitInit(directory: string) {
  // In tests, refuse git init outside temp directories
  if (process.env.NODE_ENV === 'test') {
    const normalized = normalize(resolve(directory));
    const tmpDir = normalize(resolve(tmpdir()));

    if (!normalized.startsWith(tmpDir)) {
      throw new Error(
        `Refusing git init outside temp dir during tests: ${directory}`
      );
    }
  }
  // ... proceed
}
```

#### 19.3.4 第 4 层：调试探针（Layer 4: Debug Instrumentation）
**目的：** 为事后取证捕获上下文

```typescript
async function gitInit(directory: string) {
  const stack = new Error().stack;
  logger.debug('About to git init', {
    directory,
    cwd: process.cwd(),
    stack,
  });
  // ... proceed
}
```

### 19.4 应用这个模式（Applying the Pattern）

当你发现一个缺陷时：

1. **追踪数据流** —— 坏值从哪儿来？在哪儿被用？
2. **标出所有检查点** —— 列出数据流经的每一个点
3. **在每一层加校验** —— 入口、业务、环境、调试
4. **逐层测试** —— 试着绕过第 1 层，验证第 2 层能接住它

### 19.5 一次会话中的例子（Example from Session）

缺陷：空的 `projectDir` 导致 `git init` 跑在了源代码目录里

**数据流：**
1. 测试准备 → 空字符串
2. `Project.create(name, '')`
3. `WorkspaceManager.createWorkspace('')`
4. `git init` 在 `process.cwd()` 里执行

**加上的四层：**
- 第 1 层：`Project.create()` 校验非空/存在/可写
- 第 2 层：`WorkspaceManager` 校验 projectDir 非空
- 第 3 层：`WorktreeManager` 在测试中拒绝在 tmpdir 之外执行 git init
- 第 4 层：在 git init 之前记录栈追踪日志

**结果：** 全部 1847 个测试通过，缺陷无法再复现

### 19.6 关键洞察（Key Insight）

四层全都必要。在测试过程中，每一层都接住了其他层漏掉的缺陷：
- 不同的代码路径绕过了入口校验
- Mock 绕过了业务逻辑检查
- 不同平台上的边界情况需要环境防护
- 调试日志识别出了结构性的误用

**不要在一个校验点上停下。** 在每一层都加上检查。
