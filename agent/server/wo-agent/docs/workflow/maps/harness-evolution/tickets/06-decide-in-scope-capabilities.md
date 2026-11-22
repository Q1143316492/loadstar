## 问题

基于四份研究（会话与恢复、LLM 层、组合与扩展、工具管线与权限），决定哪些候选架构进入 wo-agent 的演进路线、哪些只作为参考卡片，哪些判出范围。

这是本地图的核心闸门，输入是 `research/` 下四份文档，判断标准：

1. 是否服务「可控规模的 Python 内核 + 极窄宿主」。
2. 学习价值是否足以抵消实现与维护成本。
3. 是否与 wo-agent 既有的单向依赖与「无特权核心」冲突。
4. 对个人知识与 skill 库的迭代是否有可复用产出。

为每个候选架构给出三种处置之一：**进路线**、**只留卡片**、**判出范围**，并写明理由。若研究之间给出相互矛盾的信号（例如某机制在 dsh 成立但依赖 Cordis），以「概念可借、实现不搬」为原则裁决。

类型：grilling
状态：已解决
阻塞于：02, 03, 04, 05

## 答案

用户以学习者身份采纳全部推荐答案（2026-11-19）。三类处置如下。

### 进路线

**会话持久性**：效果前 flush / checkpoint、加载时合成 closers、严格加载与格式拒绝、增量 append 与 torn-tail 前缀恢复、请求与工具 intent 及预留 id、压缩锁的崩溃语义（加载时关闭孤立压缩）。

**LLM 层**：provider 注册表与路由选择、auth 解析（环境变量加显式 override）、usage 计量（轻量 meter）、错误分类与 per-route 重试策略。

**组合层**：组合期校验与 diagnostics、可逆注册与 disposer、skill 发现 diagnostics。

**工具管线**：pre-execute 三态（allow / deny / ask）加审批通道（`bash` 默认 ask）、执行器级协作超时、结构化错误码、并发安全标记（默认 exclusive）、bash 子进程剔除敏感环境变量。

### 只留卡片

entry tree / lane / fork 与 SQLite 后端；模型能力协商与跨 provider 消息变换（等第二个 provider）；Api 层拆分；canonical output 与 presentation 契约；post-execute 各插件；sandbox seam；permission preset；usage ledger 的独立形态（用量并入 LLM 层计量）。

### 判出范围

Cordis 运行时与 profile / bundle / patch 分层；preset roster 与信任模型；scope 父链与 `isolate` realm；HMR；TypeScript 扩展宿主；多 lane / 分支 / subagent；precise rewrite；OAuth 与云凭据；模型目录生成；数十家 provider 适配。

### 两处合并

- 「最小扩展点事件」不单独做，与工具管线的 pre-execute 接缝合并为同一个点。
- usage ledger 不新增事件类型，先由 LLM 层 meter 从 `assistant/message.usage` 折叠。
