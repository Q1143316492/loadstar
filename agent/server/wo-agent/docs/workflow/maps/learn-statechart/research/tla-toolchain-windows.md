# TLA+ / TLC 在 Windows 11 上的最小路径

调查日期：2026-11-24。目标机器：Windows 11 Enterprise（10.0.26200），仓库 `d:\Workspace\lodestar\agent\server\wo-agent`，Python 3.12.0，已有 `.venv`。

结论先行：

- **交互学习**用 VS Code 扩展 `tlaplus.vscode-ide`：当前版本自带 TLC（`tla2tools.jar`），只需要另装一个 Java 11+。本机缺 Java，补一个即可。
- **命令行 / 脚本**直接下 `tla2tools.jar`，用任意 Java 11+ 跑；这是本机实际验证过的路径。
- **Toolbox** 自带 JRE，但官方 README 已标注它「currently unmaintained」，且只有 GUI，不推荐作为最小路径。
- **mise** 是上游 pstack `statechart` 的安装方式，Windows 有二进制，但本机未跑通验证（下载未完成）。
- 规格放 `docs/learn-statechart/specs/`，`.tla` 与 `.cfg` 进版本管理，TLC 生成的 `states/` 与 `*.out` 忽略。

以下每条关键结论都注明来源或「本机实测」。

## 1. 四种安装方式对比

| 方式 | 额外需要 | 下载体积 | 首次联网 | 形态 | 本机验证 |
|---|---|---|---|---|---|
| VS Code 扩展 `tlaplus.vscode-ide` | Java 11+（推荐 21 LTS） | 扩展 18.58 MB，内含 `tla2tools.jar` 4.51 MB；JDK zip 约 141 MB / JRE zip 约 58.6 MB | 是 | GUI，扩展内置 TLC | 扩展未安装；其内置 TLC 已解包实测可跑 |
| 官方 Toolbox | 无（自带 JRE） | Windows zip 182.3 MB（v1.7.4）/ 247.0 MB（v1.8.0 pre） | 是 | Eclipse GUI，自带 JRE/TLC | 未验证 |
| `mise` | 无（mise 自己拉 Java 与 jar） | mise zip 88.8 MB；Java JDK zip 约 141 MB；jar 2.27 MB | 是 | CLI 版本管理器，上游脚本用 | 未验证 |
| 直接下 jar | Java 11+ | `tla2tools.jar` 2.27 MB（v1.7.4）/ 4.51 MB（v1.8.0 pre） | 是（下 jar、装 Java） | CLI，最透明 | **已实测** |

体积来源：`tla2tools.jar` 与 Toolbox zip 取自 GitHub release 的 asset 列表（<https://github.com/tlaplus/tlaplus/releases/tag/v1.7.4>、<https://github.com/tlaplus/tlaplus/releases/tag/v1.8.0>）；扩展 vsix 18,575,989 字节取自 Open VSX（<https://open-vsx.org/extension/tlaplus/vscode-ide>）；Temurin 25 zip 大小取自 Adoptium release 的 `Content-Length`（JDK 141,285,173 / JRE 58,589,419 字节）。

### 1.1 VS Code 扩展（推荐用于交互学习）

- 扩展 ID 是 `tlaplus.vscode-ide`，发布者 `tlaplus`，仓库 <https://github.com/tlaplus/vscode-tlaplus>。它是 TLA+ 项目自己的扩展（不是 Microsoft 发布者；Open VSX 显示发布者账号为 Markus Kuppe），当前显示名「TLA+ (Temporal Logic of Actions)」。
- **自带 TLC**：本机把 Open VSX 上 2026-11-19 发布的 `2026.11.191815` 版 vsix 解开，里面有 `extension/tools/tla2tools.jar`（4.51 MB）与 `CommunityModules-deps.jar`（4.93 MB），jar 的 `Implementation-Version` 是 `2.0 2026-11-19`。也就是说扩展不需要另外下载 TLC，只需要 JVM。
- **Java 要求**：扩展 wiki 原文「the extension doesn't come with a JVM onboard」，需要 JVM；「TLA+ tools can be used with Java 8, yet it's strongly recommended to use Java 11 or higher」（<https://docs.tlapl.us/using:vscode:installing_java>）。TLA+ tools 仓库 README 写的是「The TLA+ tools require Java 11+ to run」（<https://github.com/tlaplus/tlaplus#readme>）。
- **Java 定位**：优先用 PATH 上的 `java`；也可以在设置 `tlaplus.java.home` 指到 JDK/JRE 的**根目录**（不是 `java.exe` 路径）。找不到时报「Java executable not found. Check the Java Home setting.」（<https://docs.tlapl.us/using:vscode:troubleshooting>）。
- **版本提示**：扩展内置的是 TLA+ Tools `2.0 2026-11-19`，对应 GitHub 上仍标为 pre-release 的 v1.8.0。想用稳定版 TLC 就改用直接下 jar 的 1.7.4。
- **VS Code 版本**：`package.json` 的 `engines.vscode` 为 `^1.96.0`；本机 1.111.0 满足。
- **Windows 已知坑**：历史上 `-cp` 覆盖 jar 路径时不支持带引号的路径（issue 169，2020 年已关闭）；优先用 `tlaplus.java.home`，不要自己塞 `-cp`。没有找到当前版本的其他 Windows 专属问题记录。

### 1.2 官方 Toolbox

- 官方说明：Eclipse 基础的 GUI，可编辑规格、跑 PlusCal、跑 TLC、看错误轨迹（<https://docs.tlapl.us/using:toolbox>）。下载页：<https://lamport.azurewebsites.net/tla/toolbox.html>。
- **不需要另装 JDK**：官方页面在 release notes 里写「Installing the Toolbox now automatically installs Java, so there is no need to install it manually」；Windows 包 182–247 MB 也与自带 JRE 相符。具体 JRE 版本未解包核对。
- **维护状态**：TLA+ 仓库 README 明确写「The Eclipse-based TLA⁺ Toolbox GUI is also available from this repository, but it is currently unmaintained.」（<https://github.com/tlaplus/tlaplus#readme>）。
- **Windows 坑**：首次运行 exe 可能被 SmartScreen 拦，官方页面让你在警告窗口里找「仍要运行」（<https://lamport.azurewebsites.net/tla/toolbox.html>）。只有 GUI，不适合脚本化或 CI。

### 1.3 mise（上游 pstack 的做法）

上游 `statechart` 脚本的实际 pin（源码 <https://github.com/cursor/plugins/blob/main/harness/pstack/claude-code/skills/statechart/scripts/run.ts>）：

```ts
const TLC_TOOL =
  "http:tla2tools[url=https://github.com/tlaplus/tlaplus/releases/download/v1.7.4/tla2tools.jar,checksum=sha256:936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88]@1.7.4";
const JAVA_TOOL = "java@temurin-25";
```

首次运行依次执行 `mise where …`，缺失时 `mise install java@temurin-25 <tla2tools>`；也支持用环境变量 `TLA2TOOLS`（jar 路径）与 `JAVA`（java 可执行文件）绕过 mise。SKILL 原文：「The first run installs TLC and Java with mise and needs the network.」（<https://github.com/cursor/plugins/blob/main/harness/pstack/claude-code/skills/statechart/SKILL.md>）

mise 自身：

- Java 支持来自内置 core plugin，文档示例是 `mise use -g java@openjdk-17`（<https://mise.jdx.dev/lang/java.html>）。`temurin-25` 这种 vendor 形式也在支持范围内：mise 的 Windows x64 Java 元数据 <https://mise-java.jdx.dev/jvm/ga/windows/x86_64.json> 里有 `temurin` 的 25.x 条目；解析逻辑对带 vendor 的版本优先选 `image_type = jdk`（`src/plugins/core/java.rs`），所以 `java@temurin-25` 拉的是 JDK zip，约 141 MB。
- Windows 安装：mise README 给的是 PowerShell `irm https://mise.run/powershell | iex` 或 `winget install jdx.mise`，并列出 Windows x64/arm64 的 release 资产（<https://github.com/jdx/mise#readme>、<https://github.com/jdx/mise/releases/tag/v2026.11.12>）。
- **文档自相矛盾**：mise 的 getting-started 页面仍写「Windows isn't currently supported.」（<https://github.com/jdx/mise-docs/blob/main/getting-started.md>），但 README 与 release 资产都提供 Windows 支持。以 README/release 为准，文档滞后。
- **本机状态**：未装 mise；本次下载 88.8 MB 的 Windows zip 时，第一次停在 32 MB，重试到 55 MB 仍未完成，因此未做 `mise install` 验证。mise 路径在本机标为**未验证**。

### 1.4 直接下 jar（最小、最透明）

- 稳定版 v1.7.4：`tla2tools.jar` 2,274,532 字节，sha1 `bee4a54f3ee3d4afc347c3240ec2d9e93b075104`，sha256 `936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88`（sha256 与上游 mise pin 一致；本机下载后 `sha256sum` 复核相同）。
- pre-release v1.8.0：`tla2tools.jar` 4,510,915 字节。
- 运行方式（README 原文）：`java -cp tla2tools.jar tlc2.TLC -help`，或 `java -jar tla2tools.jar`（等价于跑 TLC）（<https://github.com/tlaplus/tlaplus#readme>）。
- 只需要 Java 11+；TLC 本身不再下载任何东西。

## 2. 本机现状核查（2026-11-24 实测）

在 Git Bash 下执行，实际输出如下：

| 检查 | 命令 | 结果 |
|---|---|---|
| Java | `java -version` | `java: command not found`（exit 127） |
| javac | `javac -version` | `javac: command not found` |
| JAVA_HOME | `echo "$JAVA_HOME"` | 空 |
| Node | `node --version` | `v24.21.0` |
| mise | `mise --version` | `mise: command not found` |
| VS Code | `code.cmd --version` | `1.111.0`，commit `ce099c1e…`，x64 |
| VS Code 扩展 | `code.cmd --list-extensions` | 20 条，**没有** TLA+ 相关扩展 |
| Python | `.venv/Scripts/python --version` | `Python 3.12.0` |

补充：

- PATH 上没有 `java`，常见 JDK 目录（`C:\Program Files\Java`、`Eclipse Adoptium`、`Microsoft\jdk*`）也不存在；这台机器确实没有安装 JDK。
- 本机有 JetBrains IDE 自带的 JBR，可作临时验证用，但不是受支持的 JDK 安装方式：PyCharm/Rider/WebStorm 的 `jbr` 是 OpenJDK 25.0.4.1，Writerside 的是 OpenJDK 21.0.5。
- `code --list-extensions` 在 Git Bash 里会报 `bad option: --list-extensions`（PATH 解析到了 `Code.exe`）；用 `code.cmd --list-extensions` 或在 PowerShell 里执行 `code --list-extensions` 才正常。
- 本机 Node 24.21.0 满足上游 `statechart` 的要求（Node 22.18–22.x 或 23.6+，Windows 原生用 `node --disable-warning=ExperimentalWarning scripts/statechart.ts`）。

## 3. 规格文件的落点与版本管理

**落点**：`docs/learn-statechart/specs/`。理由：

- 教程产物统一在 `docs/learn-statechart/`（票 01 的文件清单已经预定 `specs/FoldSurface.tla`、`specs/Inbox.tla`）。
- 不要放在 `docs/workflow/maps/learn-statechart/`：那是规划区（地图与票），教程正文与示例属于另一个目录。
- 不要把 jar/JDK 放进 `docs/`；二进制走 `.vendor/`（仓库 `.gitignore` 已有 `.vendor/`，且 `cli/boot.py` 已用 `.vendor/rg` 的先例）。

**进版本管理**：`.tla` 与 `.cfg` 都进 git。它们是纯文本、几 KB、教程的一部分，需要可复现、可 review、可回放反例。没有密钥或机器相关路径。

**不进版本管理**：TLC 运行产生的 `states/`（每次运行一个时间戳子目录，装指纹集）与扩展产生的 `*.out`。本机实测 `states/` 会出现在运行目录下。建议在 `.gitignore` 增加（本次未改仓库配置，仅建议）：

```gitignore
# TLA+/TLC generated
states/
docs/learn-statechart/specs/*.out
```

## 4. 最小可行验证

### 4.1 规格与 cfg（四状态）

`docs/learn-statechart/specs/Counter.tla`：

```tla
---- MODULE Counter ----
EXTENDS Naturals

VARIABLES phase

Init == phase = "idle"

Next == \/ phase = "idle"   /\ phase' = "queued"
        \/ phase = "queued" /\ phase' = "active"
        \/ phase = "active" /\ phase' = "done"
        \/ phase = "done"   /\ phase' = "done"

Spec == Init /\ [][Next]_phase

TypeOK == phase \in {"idle", "queued", "active", "done"}

NotDone == phase /= "done"

====
```

`docs/learn-statechart/specs/Counter.cfg`：

```
SPECIFICATION Spec
INVARIANT TypeOK
```

`done` 加了不改状态的自环，否则 TLC 会把终态当 deadlock 报（上游 SKILL 也强调这一点：「A state with no step out breaks `NoDeadlock`」）。

### 4.2 从零到跑出结果

方式 A：已有 Java 11+（本机验证用的就是 JetBrains JBR 21/25；正式环境建议装 Temurin 21）。

```sh
# 在仓库根
mkdir -p .vendor/tlaplus
curl -L -o .vendor/tlaplus/tla2tools.jar \
  https://github.com/tlaplus/tlaplus/releases/download/v1.7.4/tla2tools.jar
sha256sum .vendor/tlaplus/tla2tools.jar
# 期望 936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88

# 写 specs/Counter.tla 与 Counter.cfg 后，在 specs 目录运行
cd docs/learn-statechart/specs
java -XX:+UseParallelGC -cp ../../../.vendor/tlaplus/tla2tools.jar \
  tlc2.TLC -config Counter.cfg Counter.tla
```

方式 B：装 JDK（本机 `winget` 可用，包 ID 已核实）。

```sh
winget install EclipseAdoptium.Temurin.21.JDK
# 新开终端，确认
java -version
```

方式 C：VS Code 扩展。

```sh
winget install EclipseAdoptium.Temurin.21.JDK
code --install-extension tlaplus.vscode-ide
# 打开 Counter.tla，命令面板执行 "TLA+: Check model"
# 若扩展找不到 Java，在设置里把 tlaplus.java.home 指到 JDK 根目录
```

`winget` 本机版本 v1.29.380；`winget search --id EclipseAdoptium.Temurin.21.JDK` 与 `winget search --id jdx.mise` 都能查到包（本机实测）。JDK 安装后是否自动改 PATH 未在本机验证。

### 4.3 本机真实输出

用 `tla2tools.jar` v1.7.4（TLC 2.19）配 JBR 21，运行 `Counter.tla`：

```text
TLC2 Version 2.19 of 08 August 2024 (rev: 5a47802)
Running breadth-first search Model-Checking with fp 4 and seed ... with 1 worker on 20 cores ...
Parsing file ...\Counter.tla
Semantic processing of module Naturals
Semantic processing of module Counter
Computing initial states...
Finished computing initial states: 1 distinct state generated ...
Model checking completed. No error has been found.
5 states generated, 4 distinct states found, 0 states left on queue.
The depth of the complete state graph search is 4.
Finished in 00s ...
```

exit code `0`，冷启动整次进程耗时 **853 ms**（本机计时）。

同一规格改用扩展内置的 TLA+ Tools `2.0 2026-11-19` 配 JBR 21：

```text
TLC2 Version 2026.11.19.180144 (rev: bc1b506)
...
Model checking completed. No error has been found.
5 states generated, 4 distinct states found, 0 states left on queue.
Finished in 00s ...
```

exit code `0`。说明扩展里的 TLC 在当前机器 + Java 21 上可用；未验证的是 VS Code 的 GUI 集成。

### 4.4 故意失败

把 `Counter-bad.cfg` 写成：

```
SPECIFICATION Spec
INVARIANT TypeOK
INVARIANT NotDone
```

再跑：

```text
Error: Invariant NotDone is violated.
Error: The behavior up to this point is:
State 1: <Initial predicate>
phase = "idle"
State 2: <Next line 8, col 12 to line 8, col 48 of module Counter>
phase = "queued"
State 3: <Next line 9, col 12 to line 9, col 48 of module Counter>
phase = "active"
State 4: <Next line 10, col 12 to line 10, col 46 of module Counter>
phase = "done"
4 states generated, 4 distinct states found, 0 states left on queue.
```

exit code `12`（本机实测）。TLC 的退出码在 `EC.java` 里定义：`0` 成功，`11` deadlock，`12` safety violation（不变量/安全性质），`13` liveness violation，`14` assert failure（<https://github.com/tlaplus/tlaplus/blob/master/tlatools/org.lamport.tlatools/src/tlc2/output/EC.java>）。上游 `statechart` 把 `11/12/13` 统一当作「规则被打破」。

## 5. 耗时、联网与坑

### 5.1 需要联网的步骤

| 步骤 | 是否联网 | 本机观察 |
|---|---|---|
| 装 JDK（winget 或 Adoptium zip） | 是 | 未安装，耗时未测 |
| 装 VS Code 扩展 | 是 | 未安装，耗时未测 |
| 下 `tla2tools.jar` | 是，2.27 MB | 秒级（本机） |
| 跑 TLC | 否 | 4 状态 0.85 s（本机） |
| mise 首次 `mise install` | 是，约 141 MB + 2.27 MB | 未跑通；88.8 MB 的 mise zip 第一次停在 32 MB，重试到 55 MB 仍未完成 |

网络提示：这台机器访问 GitHub release 大文件不稳定。2.27 MB 的 jar 和 18.6 MB 的 vsix 正常，88.8 MB 的 mise zip 会停。装 JDK 时优先用 winget（走 Microsoft 源）或 Adoptium 官方镜像，别假设 GitHub 大文件一定下得完。

### 5.2 Java 版本与路径

- 本机没有 `java`、`JAVA_HOME` 为空。任何方式的第一步都是补 Java；不补则扩展报「Java executable not found」，CLI 直接 `command not found`。
- TLA+ tools 要求 **Java 11+**（官方 README）。本机用 Java 21 与 Java 25 都跑通了 TLC 2.19 与 2.0，说明新版本 JVM 没有兼容问题。
- 扩展的 `tlaplus.java.home` 要填 JDK/JRE 根目录，不是 `java.exe`。路径含空格时优先用这个设置；不要用 `-cp "C:\...\tla2tools.jar"` 覆盖（历史 issue 169）。
- Java 25 下 TLC 会提示建议加 `-XX:+UseParallelGC`。加了这个参数后警告消失（本机实测），不加也能跑。
- 不要依赖 JetBrains 的 `jbr` 作为长期方案：IDE 升级可能换掉它。它只适合本次这种「先验证」的场景。

### 5.3 Windows 专属

- Git Bash 里 `code --list-extensions` 会报 `bad option`；用 `code.cmd` 或 PowerShell。
- Toolbox 首次运行可能被 SmartScreen 拦（官方页面已说明），且只有 GUI。
- TLC 会在当前目录建 `states/`，别提交。
- 本仓路径 `d:\Workspace\lodestar\agent\server\wo-agent` 不含空格；规格目录也在其下，暂时不会触发路径引号问题。

## 6. 未验证清单

明确标为未验证的项：

1. VS Code 扩展的安装与 GUI 内 `TLA+: Check model`（没有往用户的 VS Code 安装扩展）。扩展内置 TLC 已单独解包跑通。
2. 官方 Toolbox 的下载、启动、自带 JRE 版本。
3. mise 的 Windows 安装与 `mise install java@temurin-25 <tla2tools>`（下载中断）。
4. winget 安装 Temurin 21 后 PATH/JAVA_HOME 的自动配置行为。
5. 各下载步骤在稳定网络下的实际耗时（本机网络对 GitHub 大文件不稳定，不能代表一般情况）。

## 7. 建议的最短路线

给本仓教程用：

1. `winget install EclipseAdoptium.Temurin.21.JDK`，重开终端，`java -version` 确认。
2. `code --install-extension tlaplus.vscode-ide`（或 PowerShell 里执行）。
3. 规格写到 `docs/learn-statechart/specs/`，`.tla` / `.cfg` 提交，`states/` 与 `*.out` 忽略。
4. 想脱离 VS Code 或写脚本时，再下 `tla2tools.jar` 到 `.vendor/tlaplus/`，用同一条 `tlc2.TLC` 命令。

## 来源

- TLA+ tools 仓库与 Java 11+ / Toolbox 维护状态：<https://github.com/tlaplus/tlaplus#readme>
- v1.7.4 release assets 与 checksum：<https://github.com/tlaplus/tlaplus/releases/tag/v1.7.4>
- v1.8.0 pre-release assets：<https://github.com/tlaplus/tlaplus/releases/tag/v1.8.0>
- TLC 退出码定义：<https://github.com/tlaplus/tlaplus/blob/master/tlatools/org.lamport.tlatools/src/tlc2/output/EC.java>
- VS Code 扩展仓库：<https://github.com/tlaplus/vscode-tlaplus>
- 扩展安装说明：<https://github.com/tlaplus/vscode-tlaplus/wiki/How-to-Install>
- 扩展 Java 说明：<https://docs.tlapl.us/using:vscode:installing_java>
- 扩展故障排查：<https://docs.tlapl.us/using:vscode:troubleshooting>
- 扩展 Open VSX 元数据与下载：<https://open-vsx.org/extension/tlaplus/vscode-ide>
- 扩展 Marketplace 页面：<https://marketplace.visualstudio.com/items?itemName=tlaplus.vscode-ide>
- Toolbox 官方页面：<https://lamport.azurewebsites.net/tla/toolbox.html>
- Toolbox 文档：<https://docs.tlapl.us/using:toolbox>
- 上游 pstack `statechart` 工具 pin：<https://github.com/cursor/plugins/blob/main/harness/pstack/claude-code/skills/statechart/scripts/run.ts>
- 上游 `statechart` SKILL：<https://github.com/cursor/plugins/blob/main/harness/pstack/claude-code/skills/statechart/SKILL.md>
- mise Java 文档：<https://mise.jdx.dev/lang/java.html>
- mise Java core plugin 源码：<https://github.com/jdx/mise/blob/main/src/plugins/core/java.rs>
- mise README（Windows 安装）：<https://github.com/jdx/mise#readme>
- mise getting-started（仍写 Windows 不支持）：<https://github.com/jdx/mise-docs/blob/main/getting-started.md>
- mise Windows release 资产：<https://github.com/jdx/mise/releases/tag/v2026.11.12>
- Adoptium Temurin 下载：<https://adoptium.net/temurin/releases/>
