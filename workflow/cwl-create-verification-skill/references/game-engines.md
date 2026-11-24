# 引擎类项目的驱动方式

Unity 和 UE 没有「一条命令起一个服务」这种东西。启动一步就卡住，原因固定是这六个。

## 六个障碍

| 障碍 | 表现 |
|---|---|
| 冷启动 | Unity 首次打开要 reimport `Library/`；UE 要编译 shader、建 DDC，冷启动几十分钟 |
| 许可证 | 编辑器要激活；CI 上需要 license 文件或 license server |
| 单实例锁 | `Temp/UnityLockfile`；同一项目路径开不了第二个编辑器 |
| 不可观测 | 状态在引擎内部，截图之外没有稳定出口 |
| 构建产物 | `Library/`、`Intermediate/` 几十 GB，不进仓库，重建就是重来 |
| 无头限制 | `-nographics` 会弄坏依赖 GPU 的玩法测试 |

## 解法：驱动引擎自带的测试运行器，不驱动编辑器

这条绕开六个障碍里的四个。

### Unity

```text
Unity.exe -batchmode -projectPath . -runTests -testPlatform PlayMode \
  -testResults results.xml -logFile -
```

前提是仓库里有 Test Framework（`com.unity.test-framework`）和一个 Tests 程序集（`.asmdef` 引用测试包）。

**没有时，报告 `no drivable harness`，停。** 为它编一套配方，只会产出教错步骤的手册。

证据：XML 结果、日志、失败时的截图。

`-nographics` 只能跑纯逻辑测试。渲染相关的测试要留图形，那就只能在有显示器的机器上跑。

### UE

```text
UnrealEditor-Cmd.exe Project.uproject -unattended -nopause -nullrhi ^
  -ExecCmds="Automation RunTests <Filter>;Quit" -log
```

前提是项目里有自动化测试（`IMPLEMENT_SIMPLE_AUTOMATION_TEST`）。

证据：自动化报告、日志。打包版本走 Gauntlet。

## 写进手册时的形状

`Driving it with <harness>` 一节不写「点哪里」，写**测试入口**：

```text
Preconditions:
- 项目已构建过一次（Library/ 或 Intermediate/ 存在）
- 没有别的编辑器实例占着这个项目
- 许可证有效

- **跑一个测试类。** 命令：... 结果：results.xml 里 <test-case name="..."> 的 result 是 Passed
- **取证。** 命令：... 产出：results.xml、日志、失败截图
```

## 引擎项目的第一个产出往往是诊断

没有测试程序集的引擎项目，`cwl-create-verification-skill` 的第一次运行产出的是「你缺 harness」这个结论，不是一份驱动手册。

**这个诊断本身就值钱。** 它把这个项目当前的状态说清楚了：没有任何程序化方式证明它真的能跑。

## 清理

引擎项目尤其要盯住：

- 编辑器进程按 PID 杀，不按 `Unity.exe` 这个名字杀
- `-batchmode` 失败时可能留下 `Temp/UnityLockfile`，下次启动会卡住，要显式删
- 证据（`results.xml`、日志、截图）放在手册点名的位置，清理之后去确认还在
