# 动手搬家

## 问题

真正搬家的活。等目录边界与 server 形态定了再做，做完把事实记进本票：

1. 把 wo-agent 带历史弄进 `agent/server/wo-agent/`，先处理它本地未提交的改动。
2. 把 `agent-hook/hooks/` 与 `agent-hook/pet/` 分别挪到 `agent/hooks/` 与 `agent/client/pet/`。
3. 判定逻辑从 pet 移到 `agent/server/`（按 03 票的结论）。
4. 改所有写死的路径：`cwl-pet` 技能里的命令与链接、`agent-hook/README.md`、`hooks/install.js` 生成的钩子命令——**已经写进用户 `~/.claude/settings.json` 的那五条要重装**。
5. 更新 lodestar 的 `README.md` 与 `docs/workflow-map.md`。
6. 处理旧地图 [`agent-hook`](../agent-hook/map.md)：路径失效，标为归档或就地更新；它那张「跑通最小闭环」票的归属要说明。
7. 确认 `cwl-sync` 不受影响（它只碰 `workflow/cwl-*`）。

做完记下：新路径、重装钩子的命令、还有什么没迁（例如 `pet/logs/` 与 `pet/state/` 这类运行时目录）。

## 已知事实

- 钩子命令里是**绝对路径**（`D:/Workspace/lodestar/agent-hook/hooks/claude-code-hook.js`），挪目录后旧命令会失效，必须重装。
- 用户级配置里目前装着 5 条本项目钩子，`install.js` 幂等且能识别旧条目并原地更新。
- `agent-hook/` 下 `pet/node_modules/`、`pet/state/`、`pet/logs/` 已被 `.gitignore` 排除，搬家时不必带走。

类型：task
状态：已解决
阻塞于：01

## 答案（2026-11-22）

随 01 一起执行完毕：

1. wo-agent 经 `git subtree add` 进入 `agent/server/wo-agent/`（原仓库未提交改动先提交为 `0df8d82`）。
2. `agent-hook/hooks/` → `agent/hooks/`；`agent-hook/pet/` → `agent/client/pet/`，均用 `git mv` 保留历史。
3. 路径全部改写：`agent/README.md`、`workflow/cwl-pet/SKILL.md`、`launch.vbs`、`simulate.js`、`.gitignore`、根 `README.md`、`docs/workflow-map.md`。
4. 钩子重装，五条命令指向 `agent/hooks/claude-code-hook.js`，旧路径零残留。
5. `cwl-sync` 未受影响（只碰 `workflow/cwl-*`）。

验证：`npm test` 全过；`/health` 正常；手动探针 exit 0；模拟器跑通。

遗留：旧地图 [`agent-hook`](../../agent-hook/map.md) 未标记归档，其「跑通最小闭环」票仍为「已认领」。
