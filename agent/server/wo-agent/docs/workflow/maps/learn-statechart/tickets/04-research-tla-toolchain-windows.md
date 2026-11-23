## 问题

在 Windows + 本仓环境里，跑通 TLA+/TLC 的最小路径是什么？

需要落实的事实：

1. 哪种安装方式最少摩擦：VS Code 的 TLA+ 扩展（自带 TLC）／官方 Toolbox／`mise`（上游 statechart 脚本用的就是它）／直接下 jar。各自的 JDK 依赖与体积。
2. 在本仓哪个目录放规格文件最合适：`docs/learn-statechart/specs/`？还是临时目录？规格文件是否应该进版本管理。
3. 一次最小规格（四五个状态）从零到跑出结果的实际耗时，以及需要联网的步骤。
4. 若这台机器的 Java 版本或路径有坑，提前记下来。

答案写进 `../research/tla-toolchain-windows.md`，本票只留指针。

类型：research
状态：已解决
阻塞于：无

## 答案

本机最省事的路径是 `winget install EclipseAdoptium.Temurin.21.JDK` 加 VS Code 扩展 `tlaplus.vscode-ide`——扩展自带 TLC，不需要另下 jar；只想用命令行则下 `tla2tools.jar`（稳定版 1.7.4，2.27 MB）配任意 Java 11+。已在本机用 JetBrains JBR 21/25 实测四状态规格：TLC 2.19 与扩展内置的 2.0 都在 0.85 s 内跑完，exit 0；故意违反不变量时 exit 12 并给出最短反例。规格放 `docs/learn-statechart/specs/`，`.tla` / `.cfg` 进版本管理，TLC 生成的 `states/` 与 `*.out` 忽略。mise 与 Toolbox 未在本机验证：mise 的 Windows 文档与 README 自相矛盾，上游 pstack 用 `java@temurin-25` + `tla2tools` 1.7.4。完整对比、命令与真实输出见 [research/tla-toolchain-windows.md](../research/tla-toolchain-windows.md)。
