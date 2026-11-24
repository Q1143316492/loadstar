# 功能地图范文

生成手册时照这个形状写。

## README.md 的五节

```markdown
# <应用名> 验证地图

这个目录是验证 <应用名> 用户可见行为的维护中事实源。驱动之前先读索引，
再按对应的功能文件走。

## 覆盖范围

覆盖：浏览器端的笔记创建、搜索、删除。
不覆盖：CLI 与 API（见 verify/cli）、导出功能（尚未驱动）。

## 基线前提

- 在 http://127.0.0.1:4173 启动，用可丢弃的数据目录。
- 设 `<APP>_DATA_DIR=/tmp/<app>-verify-$RUN_ID`，让并发运行不共享状态。
- 预置标题为 `Quarterly plan` 与 `Grocery list` 两条数据。
- 把 `<驱动工具>` 放进 PATH。
- 跑 `<驱动工具> doctor`，要求它报出预期的地址、数据目录、构建版本。
- 绝不驱动不是本次验证启动的实例。

## 驱动约定

- 每个配方都从基线状态开始，除非它的前置条件另说。
- 优先用 ARIA 角色与可访问名，不用 CSS 选择器或 DOM 位置。
- 命令照字面执行。引号里的名字和 flag 原样保留。
- 浏览器动作走 `<工具> browser`。
- 终端动作走 `<工具> cli -- <命令>`。
- 改动数据之后恢复种子数据。清理时不删证据。

## 证明标准

- 抓用户动作和它造成的结果，不是只抓最后一屏。
- UI 证据包含 ARIA 快照和一张能认出应用身份的截图。
- CLI 证据包含命令、stdout、stderr、退出码。
- 写操作证据包含一次从第二个视图的只读确认。
- 每个证据记录用了哪个功能 id、哪个入口。
- 路径到不了时，报出尝试过的命令和未满足的前置条件。
- 不用一个入口的报告冒充另一个入口已验证。
- 只在该隔离的外部系统确实被隔离时才用 mock。
- 安全路径是 dry-run 或测试模式时，观察它到底跳过了什么（文件、网络、git refs），而不是相信它的名字。有些 dry-run 仍然会访问网络或打开浏览器。

## 功能索引

- [新建笔记](./create-note.md) —— 浏览器与 CLI 新建、取消、持久化、清理
- [搜索笔记](./search.md) —— 工具栏、键盘、CLI 三种入口，命中、空、清除
```

> 这个索引里的链接是范文的一部分，描述手册**生成之后**应该长什么样。本目录下没有这两个文件。

## 一个功能文件

```markdown
# 搜索笔记

搜索让用户按标题或正文找到笔记、打开其中一条，并区分「没匹配到」和「搜索不可用」。

## Sub-features

- `search-open` 从每个浏览器入口打开搜索
- `search-match` 返回标题与正文匹配，不改动数据
- `search-empty` 查询无匹配时给出完整空状态
- `search-cli` 终端返回同样的结果

## How to get to it (user POV)

- 浏览器工具栏的 `Search` 按钮
- 焦点不在输入框时按 `/`
- 终端里跑 `notes search <query>`

## Driving it with <工具>

Preconditions:

- 应用在 http://127.0.0.1:4173 上健康
- 可丢弃数据目录里有 `Quarterly plan`，正文含 `Draft budget`
- `<工具> doctor` 报出预期地址和数据目录

- **工具栏入口。** 点 `Search`。跑 `<工具> browser click --role button --name "Search"`。
  出现名为 `Search notes` 的对话框，焦点在它的搜索框里。
- **标题匹配。** 输入 `quarterly`。跑 `<工具> browser fill ...`。
  `Search results` 列表含 `Quarterly plan`，不含 `Grocery list`。
- **空状态。** 重开搜索，输入 `volcano`。跑 `<工具> browser fill ...`。
  搜索完成后出现名为 `No matching notes` 的状态。
- **CLI 命中。** 跑 `<工具> cli -- notes search "quarterly" --format json`。
  退出码 `0`，stdout 含一个 title 为 `Quarterly plan` 的对象。
- **取证。** 跑 `<工具> browser snapshot --aria --path artifacts/search/results.aria.txt`
  和 `<工具> browser screenshot --path artifacts/search/results.png`。
  两件证据都认得出应用、查询和 `Quarterly plan`。

## Gotchas

- 编辑器或搜索框有焦点时按 `/` 会输入字符，不会打开搜索。
- 结果有短暂 debounce。等结果列表或空状态出现，固定 sleep 会在快机器上假通过、慢机器上假失败。
- 归档笔记默认被排除，除非用户打开 `Include archived`。
- CLI 默认人读输出，断言要用 `--format json`。
- 打开一个结果会改变浏览器状态。证明另一个查询之前先重开搜索。
```

## 范文里最容易被漏掉的五样

- **`## 覆盖范围`**：不写，读者就无法判断「地图上没有」是功能不存在还是没人驱动过。
- **`$RUN_ID` 的数据目录**：并发运行不互相污染。
- **「从第二个视图只读确认」**：写操作只看了回显，等于没验。
- **`--format json`**：CLI 的人读输出会变，不能拿来断言。
- **Gotchas 里的 debounce 与焦点陷阱**：这两条会让一次验证偶发地假通过或假失败。
