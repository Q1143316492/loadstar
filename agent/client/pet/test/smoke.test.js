// 冒烟测试：node test/smoke.test.js
const assert = require('node:assert');
const path = require('node:path');
const { createState } = require('../state');
const { loadRules, classify } = require('../classify');
const { DEFAULTS, readPort, resolveConfig } = require('../config');

const rules = loadRules(path.join(__dirname, '..', 'tool-rules.json'));

// ---- 分类 ----
assert.equal(classify(rules, 'Read', {}), 'read');
assert.equal(classify(rules, 'Edit', {}), 'write');
assert.equal(classify(rules, 'AskUserQuestion', {}), 'write');
assert.equal(classify(rules, 'TodoWrite', {}), 'neutral');
assert.equal(classify(rules, 'Bash', { command: 'ls -la' }), 'read');
assert.equal(classify(rules, 'Bash', { command: 'git status' }), 'read');
assert.equal(classify(rules, 'Bash', { command: 'npm install lodash' }), 'write');
assert.equal(classify(rules, 'Bash', { command: 'echo hi > out.txt' }), 'write');
assert.equal(classify(rules, 'Bash', { command: 'npm test 2>nul' }), 'write');
// 箭头函数与比较运算符不是重定向：这两个曾把只读命令误判成写、把计数清零。
assert.equal(classify(rules, 'Bash', { command: 'node -e "arr.map(x => x * 2)"' }), 'neutral');
assert.equal(classify(rules, 'Bash', { command: 'if (a >= b) x' }), 'neutral');
assert.equal(classify(rules, 'Bash', { command: 'cat a.txt' }), 'read');
assert.equal(classify(rules, 'Bash', { command: 'node build.js' }), 'neutral');
assert.equal(classify(rules, 'SomeMcpTool', {}), 'neutral');
console.log('classify: ok');

// ---- 配置解析 ----
const warnings = [];
assert.deepEqual(resolveConfig({}, { warn: (m) => warnings.push(m) }), DEFAULTS);
assert.equal(warnings.length, 0);

const tuned = resolveConfig(
  {
    port: '48001',
    thresholds: { consecutiveReads: '3' },
    behavior: { clickThrough: true },
    assets: { dir: 'assets' }
  },
  { warn: (m) => warnings.push(m) }
);
assert.equal(tuned.port, 48001);
assert.equal(tuned.thresholds.consecutiveReads, 3);
// 没写的键由默认值补齐，判定层不用再自带回落数字
assert.equal(tuned.thresholds.idleMinutes, DEFAULTS.thresholds.idleMinutes);
assert.equal(tuned.window.petSize, DEFAULTS.window.petSize);
// 没有消费方的键要出声
assert.ok(warnings.some((m) => m.includes('"assets"')), 'warns about unknown top-level key');
assert.ok(warnings.some((m) => m.includes('"behavior.clickThrough"')), 'warns about unknown section key');

const bad = resolveConfig({ port: -1, window: { petSize: 'big' } });
assert.equal(bad.port, DEFAULTS.port);
assert.equal(bad.window.petSize, DEFAULTS.window.petSize);

// 钩子与桌宠共用端口：配置文件在就读它，环境变量优先，都没有才回落
const configPath = path.join(__dirname, '..', 'pet.config.json');
assert.equal(readPort(configPath), 47900);
process.env.PET_PORT = '48002';
assert.equal(readPort('/nonexistent/pet.config.json'), 48002);
delete process.env.PET_PORT;
assert.equal(readPort('/nonexistent/pet.config.json'), DEFAULTS.port);
console.log('config: ok');

// ---- 状态机 ----
let clock = 1_000_000;
const config = resolveConfig({
  thresholds: { consecutiveReads: 5 },
  nudge: { text: 'read {reads} times', systemMessage: '⏳ {reads}' }
});
const records = [];
const state = createState({
  getConfig: () => config,
  getRules: () => rules,
  logger: (id, rec) => records.push(rec),
  now: () => clock
});

const send = (event, extra = {}) => state.handleEvent({ event, session_id: 'S', cwd: 'd:/x', ...extra });

send('SessionStart');
assert.equal(state.aggregate().main.state, 'working');

for (let i = 0; i < 4; i++) send('PostToolUse', { tool_name: 'Read' });
assert.equal(state.aggregate().main.state, 'working');
assert.equal(state.aggregate().main.reads, 4);

// 中性工具不增不清
send('PostToolUse', { tool_name: 'TodoWrite' });
assert.equal(state.aggregate().main.reads, 4);

// 第 5 次读越线
const { reply } = send('PostToolUse', { tool_name: 'Read' });
assert.equal(state.aggregate().main.state, 'alert');
assert.ok(reply && reply.hookSpecificOutput.additionalContext.includes('5'));
assert.ok(reply.systemMessage.includes('5'));

// 预警后继续读不再喊话
const again = send('PostToolUse', { tool_name: 'Read' });
assert.equal(again.reply, null);

// 写操作解除
send('PostToolUse', { tool_name: 'Edit' });
assert.equal(state.aggregate().main.state, 'working');
assert.equal(state.aggregate().main.reads, 0);

// 时间窗判据：锚点后 10 分钟、至少 8 次调用。
// 把连续阈值抬高，单独验证时间窗这条路径。
config.thresholds.consecutiveReads = 100;
clock += 11 * 60_000;
for (let i = 0; i < 7; i++) send('PostToolUse', { tool_name: 'Grep' });
assert.equal(state.aggregate().main.state, 'working');
send('PostToolUse', { tool_name: 'Grep' });
assert.equal(state.aggregate().main.state, 'alert');
config.thresholds.consecutiveReads = 5;

// 用户发言解除
send('UserPromptSubmit', { prompt: 'hi' });
assert.equal(state.aggregate().main.state, 'working');

// 预警状态由写操作解除
for (let i = 0; i < 5; i++) send('PostToolUse', { tool_name: 'Read' });
assert.equal(state.aggregate().main.state, 'alert');
assert.equal(state.aggregate().alerts, 1);

send('PostToolUse', { tool_name: 'Write' });
const agg = state.aggregate();
assert.equal(agg.main.state, 'working');
assert.equal(agg.alerts, 0);

// 空闲降级
clock += 31 * 60_000;
assert.equal(state.tick(), true);
assert.equal(state.aggregate().main.state, 'idle');

// 会话结束：销毁
send('SessionEnd', { reason: 'prompt_input_exit' });
assert.equal(state.aggregate().sessions, 0);

// ---- 主动消息：这一轮做完才报 ----
const state2 = createState({ getConfig: () => config, getRules: () => rules, now: () => clock });
const send2 = (event, extra = {}) => state2.handleEvent({ event, session_id: 'T', cwd: 'D:/proj/lodestar', ...extra });
const noticesOf = () => state2.aggregate().notices;

send2('SessionStart');
send2('UserPromptSubmit', { prompt: 'do it' });
assert.equal(noticesOf().length, 0, 'no notice before any work');

// 纯聊天回合：没有工具调用，不报
send2('Stop');
assert.equal(noticesOf().length, 0, 'plain chat turn does not announce');

// 有工具调用的回合：报一次，带会话与目录
send2('UserPromptSubmit', { prompt: 'do it' });
send2('PostToolUse', { tool_name: 'Read' });
send2('PostToolUse', { tool_name: 'Edit' });
send2('Stop');
let notices = noticesOf();
assert.equal(notices.length, 1);
assert.equal(notices[0].kind, 'turn-end');
assert.equal(notices[0].session, 'T');
assert.equal(notices[0].cwd, 'D:/proj/lodestar');

// 同一轮再收到 Stop（例如别的原因重复触发）不重复报
send2('Stop');
assert.equal(noticesOf().length, 1, 'stop without new work adds nothing');

// 别的钩子让模型继续时（stop_hook_active），这一轮没真结束，不报
send2('UserPromptSubmit', { prompt: 'again' });
send2('PostToolUse', { tool_name: 'Bash' });
send2('Stop', { stop_hook_active: true });
assert.equal(noticesOf().length, 1, 'stop_hook_active does not announce');

// 另一个会话也收尾：两条都在，id 递增，窗口按 id 去重
state2.handleEvent({ event: 'UserPromptSubmit', session_id: 'U', cwd: 'D:/proj/other', prompt: 'x' });
state2.handleEvent({ event: 'PostToolUse', session_id: 'U', tool_name: 'Grep' });
state2.handleEvent({ event: 'Stop', session_id: 'U' });
notices = noticesOf();
assert.equal(notices.length, 2, 'both sessions get their own notice');
assert.equal(notices[1].session, 'U');
assert.equal(notices[1].cwd, 'D:/proj/other');
assert.ok(notices[1].id > notices[0].id);
assert.equal(notices[1].title, null, 'no title when the hook could not read one');

// 钩子读到会话标题时，消息带上它，detail 里也看得到
state2.handleEvent({ event: 'UserPromptSubmit', session_id: 'V', cwd: 'D:/proj/v', prompt: 'x' });
state2.handleEvent({ event: 'PostToolUse', session_id: 'V', tool_name: 'Bash' });
state2.handleEvent({ event: 'Stop', session_id: 'V', session_title: '整理桌宠提示' });
notices = noticesOf();
assert.equal(notices[2].title, '整理桌宠提示');
const v = state2.aggregate().detail.find((s) => s.session === 'V');
assert.equal(v.title, '整理桌宠提示');
console.log('notice: ok');

// ---- 会话标题：从 transcript 尾部读 ai-title ----
const { readSessionTitle, TAIL_BYTES } = require('../../../hooks/session-title');
const os = require('node:os');
const fs = require('node:fs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pet-title-'));
const transcript = path.join(tmp, 's.jsonl');

fs.writeFileSync(transcript, [
  JSON.stringify({ type: 'ai-title', aiTitle: '旧标题' }),
  JSON.stringify({ type: 'user', message: 'hello' }),
  JSON.stringify({ type: 'ai-title', aiTitle: '新标题' })
].join('\n') + '\n');
assert.equal(readSessionTitle(transcript), '新标题', 'last ai-title wins');

// 标题在 256 KB 之外时读不到——这是有意的取舍，不是崩溃
const filler = JSON.stringify({ type: 'user', message: 'x'.repeat(1000) }) + '\n';
fs.writeFileSync(transcript,
  JSON.stringify({ type: 'ai-title', aiTitle: '太旧了' }) + '\n' +
  filler.repeat(Math.ceil(TAIL_BYTES / filler.length) + 2));
assert.equal(readSessionTitle(transcript), null);

assert.equal(readSessionTitle(path.join(tmp, 'missing.jsonl')), null, 'missing file falls back to null');
assert.equal(readSessionTitle(''), null);
fs.rmSync(tmp, { recursive: true, force: true });
console.log('session title: ok');

// 日志里两种 kind 都有
assert.ok(records.some((r) => r.kind === 'event'));
assert.ok(records.some((r) => r.kind === 'transition' && r.to === 'alert'));
console.log('state machine: ok');

console.log('all smoke tests passed');
