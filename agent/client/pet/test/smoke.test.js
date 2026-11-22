// 冒烟测试：node test/smoke.test.js
const assert = require('node:assert');
const path = require('node:path');
const { createState } = require('../state');
const { loadRules, classify } = require('../classify');

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

// ---- 状态机 ----
let clock = 1_000_000;
const config = {
  thresholds: { consecutiveReads: 5, idleMinutes: 10, minCallsInWindow: 8, sessionIdleMinutes: 30 },
  toggles: { pet: true, systemMessage: true, agentNudge: true },
  nudge: { text: 'read {reads} times', systemMessage: '⏳ {reads}' }
};
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

// 日志里两种 kind 都有
assert.ok(records.some((r) => r.kind === 'event'));
assert.ok(records.some((r) => r.kind === 'transition' && r.to === 'alert'));
console.log('state machine: ok');

console.log('all smoke tests passed');
