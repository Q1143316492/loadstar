## 问题

这份地图要抵达什么、产物放哪、用什么闸门筛候选架构、参考目录取什么形态。

在画图会话中已与用户逐条确认：

1. 目的地是「演进路线决策集」，最后汇成一份可执行 spec；不直接做实现。
2. 地图放在 wo-agent 的 `docs/workflow/maps/`，与被规划的系统同仓。
3. 学习驱动、定位把关：先广泛建参考卡片，再用 wo-agent 的「可控规模 Python 内核 + 极窄宿主」筛选真正进入路线的架构。
4. 参考目录形态为 wo-agent 内的 `reference/harness-architectures/` 能力卡片；只钉上游本地路径与 commit，不 vendor 源码。卡片按能力生长。

用户补充：这是学习型项目，产物要能迭代个人知识与个人 AI skill 库。

类型：grilling
状态：已解决
阻塞于：无

## 答案

- 目的地：wo-agent 的 harness 演进路线 spec，含渐进顺序、每步接缝与验收、学习产物回流机制。
- 地图位置：`docs/workflow/maps/harness-evolution/`。
- 筛选闸门：学习价值优先收集，定位标准决定是否进路线；不过关者只留卡片。
- 参考目录：`reference/harness-architectures/`，能力卡片，钉路径与 commit，不 vendor。
