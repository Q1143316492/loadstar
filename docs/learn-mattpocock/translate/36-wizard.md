## 36 wizard

> 译自 `reference/mattpocock-skills/skills/engineering/wizard/SKILL.md`（原文 44 行）。frontmatter 按原样保留。

**frontmatter**

- `name`: `wizard`
- `description`: `Generate an interactive bash wizard that walks a human through steps only they can perform. Use when provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-party dashboard, or running a one-off migration or cutover. Don't invoke this for steps the agent can perform itself.`（生成一个交互式 bash 向导，带一个人走完只有他们能执行的步骤。在配置基础设施、设置凭据或 CI secret、走查一个不熟悉的第三方仪表盘，或运行一次性迁移或切换时使用。不要为 agent 自己能执行的步骤调用它。）

### 36.1 向导（Wizard）

一个**向导**是一个 bash 脚本，它一步一步地带一个人走完一套手工流程，这套流程手工做很烦，每次向 AI 重新解释也很烦。它打开每个 URL，说明确切该点什么、复制什么，捕获各个值，把它们写到该去的地方（`.env`、GitHub secrets），在每个阶段做确认，并显示还剩多少阶段。它可能配置第三方服务、跑一次性迁移，或者把项目从一个状态移到另一个状态。

令人愉快的 UX 已经由 [template.sh](../../../reference/mattpocock-skills/skills/engineering/wizard/template.sh) 解决了：逐阶段进度、确认门、跨平台打开 URL（包括 WSL）、隐藏式密钥输入、幂等的 `.env` upsert、`gh secret`/`gh variable` 写入，以及收尾摘要。**你的工作只是界定这套流程的范围并编写它的各个阶段。** `STAGES` 标记以上的库在每个向导里都完全相同；这种一致性正是要点：永远不要手工编辑它。

向导默认是短暂的：为一次运行而建，存到一个临时路径或 `scripts/` 路径，任务完成后删除。只有当用户想要一条应当住在仓库里的可重复搭建路径时，才提交它。

#### 36.1.1 流程（Process）

##### 36.1.1.1 界定流程范围（Scope the procedure）

弄清人必须走的每一个手工步骤，以及沿途会被捕获的每一个值。先读仓库，不要冷着问：

- 搭建类：`.env`、`.env.example`、`.env.*`、`README`、`docker-compose*`、框架配置，以及 `.github/workflows/*`（每一处 `secrets.*` / `vars.*` 引用都是向导必须产出的一个值）。
- 迁移或切换类：当前状态、目标状态，以及它们之间不可逆的动作。

然后把按顺序排列的阶段清单以及每个阶段产出的值给用户看，并确认：他们可以增加、删除或重排。

**完成的标志：** 每个阶段都按顺序命名，并且对每一个被捕获的值你都知道 (a) 人从哪里拿到它，(b) 它写到哪里（`.env`、一个 GitHub secret、两者都要，或者哪里都不写；有些阶段是纯动作），以及 (c) 它是秘密（隐藏式输入）还是公开的。

##### 36.1.1.2 为每个阶段画出路径（Map each stage's journey）

为每个阶段写出一个人所遵循的确切路径：打开哪个 URL、在那里做什么、值显示在哪里、它填进哪个变量：例如「Dashboard → Developers → API keys → Reveal test key → copy」。在你实际上不知道当前 UI 或确切命令的地方，就说出来并询问用户或者查文档：永远不要发明可能不存在的步骤。

**完成的标志：** 每个阶段都能追溯到一个陌生人可以照着做的具体指令。

##### 36.1.1.3 编写向导（Author the wizard）

把 `template.sh` 复制到目标路径。把示例阶段替换成每个步骤一个 `stage`，按依赖顺序排列。使用库里的辅助函数：`stage`、`say`/`step`、`open_url`、`ask`/`ask_secret`、`write_env`、`set_secret`/`set_var`、`pause`/`confirm`。把 `TOTAL_STAGES` 设为你写的阶段数量。

守住模板立下的标准：先打开 URL 再询问它的值，对任何秘密使用 `ask_secret`，对每个被持久化的值使用 `write_env`，只用 `set_secret` 处理 CI 真正需要的值，并在任何不可逆动作之前 `confirm`。每个 `stage` 都会清屏，所以只有当前步骤是可见的：让一个阶段只做一件聚焦的任务，这样人需要的东西不会被滚走。不要碰标记以上的库。

##### 36.1.1.4 验证并交接（Verify and hand off）

- `bash -n <script>`；如果有 `shellcheck` 就跑一下。
- `chmod +x <script>`。
- 不要自己端到端跑它：它会打开浏览器，并阻塞在人的输入上。改为静态地追踪它：第 1 步里的每个值都被捕获，并落在第 1 步所说的位置，而且每个 `set_secret` 名字都与 CI 里的某个 `secrets.*` 引用完全匹配。
- 告诉用户怎么运行它。如果它是一条可重复的搭建路径，就提交它并从 README 链接过去，让下一个人直接跑脚本，而不是去问 AI。
