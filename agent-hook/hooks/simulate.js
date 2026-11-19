#!/usr/bin/env node
// 模拟一个 Claude Code 会话，把事件灌给正在运行的桌宠。
//
//   node simulate.js                 # 3 次读，看桌宠是否变蓝
//   node simulate.js --reads 25      # 直接越过阈值，看是否变橙 + 打印桌宠回话
//   node simulate.js --keep          # 不发 SessionEnd，会话留在桌宠里
//   node simulate.js --end           # 结束上一次模拟的会话
//   node simulate.js --session abc   # 指定会话 id（默认 sim-<时间戳>）
//
// 输出里若有 hookSpecificOutput，就是真实会话中模型会收到的 additionalContext。

const http = require('node:http');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const PORT = Number(process.env.PET_PORT || 47900);
const HOOK = path.join(__dirname, 'claude-code-hook.js');

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};

const session = value('--session', `sim-${Date.now().toString(36)}`);
const reads = Number(value('--reads', 3));

function send(event, extra = {}) {
  const payload = { hook_event_name: event, session_id: session, cwd: process.cwd(), ...extra };
  const out = execFileSync(process.execPath, [HOOK], { input: JSON.stringify(payload), encoding: 'utf8' });
  if (!out.trim()) return null;
  try {
    return JSON.parse(out);
  } catch {
    return out;
  }
}

function health() {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port: PORT, path: '/health', timeout: 800 }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

(async () => {
  if (!(await health())) {
    console.error(`桌宠没有在 ${PORT} 端口运行。先在 agent-hook/pet 下 npm start。`);
    process.exit(1);
  }

  if (flag('--end')) {
    send('SessionEnd', { reason: 'other' });
    console.log(`会话 ${session} 已结束`);
    return;
  }

  send('SessionStart', { source: 'startup' });

  let nudged = null;
  for (let i = 1; i <= reads; i++) {
    const reply = send('PostToolUse', { tool_name: 'Read', tool_input: { file_path: `src/file-${i}.ts` } });
    if (reply && reply.hookSpecificOutput) {
      nudged = { at: i, reply };
      break;
    }
  }

  if (!flag('--keep')) send('SessionEnd', { reason: 'other' });

  console.log(`会话 ${session}：发了 ${reads} 次 Read${flag('--keep') ? '，保持打开' : '，已结束'}`);
  if (nudged) {
    console.log(`\n第 ${nudged.at} 次读越过阈值。真实会话里，模型会收到：\n`);
    console.log(`  ${nudged.reply.hookSpecificOutput.additionalContext}`);
    if (nudged.reply.systemMessage) console.log(`\n终端会显示：\n\n  ${nudged.reply.systemMessage}`);
  } else {
    console.log('没有越过阈值（桌宠应显示为「工作中」）。');
  }
})();
