# 桌宠与 wo-agent 怎么合进一个仓库

## 问题

wo-agent 现在是独立仓库（`git@github.com:Q1143316492/wo-agent.git`），本地还有未提交的改动（`docs/workflow/maps/harness-evolution/`、`docs/specs/`）。要把它带历史搬进 lodestar 的 `agent/server/wo-agent/`，并定下目录形状。要定：

- **搬法**：已定带历史搬（见地图备注），具体用 `git subtree add`、`filter-repo` 还是先移文件再补历史。原仓库之后**冻结为只读**，还是保留归档说明。
- **未提交改动怎么处理**：先在原仓库提交，还是带进 lodestar 再提交。
- **`agent/` 三个子目录的边界**：`hooks/`（Claude Code 钩子适配器）算 client 还是独立一类；`client/` 将来有多个客户端时怎么摆（`client/pet`、`client/vscode`…）。
- **wo-agent 的安装方式**：lodestar 根下能不能 `pip install -e agent/server/wo-agent`；它的 `pyproject.toml` 用 `package-dir = {"" = "src"}`、打包列表只含 `src/` 下的包，`cli/` 本来就不在其中。
- **`agent/` 的依赖与构建**：Node（pet）与 Python（server）两套依赖怎么各自声明，是否需要一个根级说明。
- **README 叙事**：lodestar 现在自称「AI 编码工作流技能库」，收进一个可运行的产品之后这句话要不要改。

类型：grilling
状态：已解决
阻塞于：无

## 答案

2026-11-22 直接执行，未逐条盘问（用户要求先做起来）：

- **搬法**：`git subtree add --prefix=agent/server/wo-agent <本地路径> HEAD`，保留 10 个提交，lodestar 为普通仓库。原仓库冻结为只读。
- **未提交改动**：先在原仓库提交（`0df8d82`），再搬。
- **目录**：`agent/hooks/`（事件来源）、`agent/client/pet/`（界面）、`agent/server/wo-agent/`（通用库）三者平级。`hooks` 不归入 `client`——它是生产者，client 是消费者。
- **安装**：wo-agent 仍可 `pip install -e agent/server/wo-agent`；`cli/` 本就不在打包列表。
- **README**：旧 `agent-hook/README.md` 搬到 `agent/README.md`，路径已改。lodestar 根 README 暂不改叙事，留待迁移完成后。
