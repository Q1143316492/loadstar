#!/usr/bin/env node
// Claude Code 钩子客户端：把工具事件转发给本机桌宠。
// 约定：无论发生什么都 exit 0 且不写 stderr —— 桌宠没开时要像不存在一样。

const http = require('node:http');

const PORT = Number(process.env.PET_PORT || 47900);
const TIMEOUT_MS = 1000;

// 只挑小字段转发，避免把整份文件内容或长命令输出灌进桌宠。
const TOOL_INPUT_KEYS = ['file_path', 'command', 'pattern', 'query', 'url', 'path', 'glob'];

function pickToolInput(input) {
  if (!input || typeof input !== 'object') return undefined;
  const out = {};
  for (const key of TOOL_INPUT_KEYS) {
    if (typeof input[key] === 'string') out[key] = input[key].slice(0, 500);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function buildPayload(raw) {
  const payload = {
    event: raw.hook_event_name || 'Unknown',
    session_id: raw.session_id || '',
    cwd: raw.cwd || '',
    ts: Date.now()
  };
  if (raw.tool_name) payload.tool_name = raw.tool_name;
  const toolInput = pickToolInput(raw.tool_input);
  if (toolInput) payload.tool_input = toolInput;
  if (!!raw.stop_hook_active) payload.stop_hook_active = true;
  return payload;
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
    // 某些宿主不会关闭 stdin；1 秒后强行开跑。
    setTimeout(() => resolve(data), 800).unref();
  });
}

function post(body) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: PORT,
        path: '/event',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: TIMEOUT_MS
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(res.statusCode >= 200 && res.statusCode < 300 ? data : ''));
        res.on('error', () => resolve(''));
      }
    );
    req.on('timeout', () => { req.destroy(); resolve(''); });
    req.on('error', () => resolve(''));
    req.write(body);
    req.end();
  });
}

(async () => {
  try {
    const raw = await readStdin();
    if (!raw.trim()) return;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    const reply = await post(JSON.stringify(buildPayload(parsed)));
    // 桌宠只在需要喊话时返回内容；空对象等同于「无话可说」，不要往 stdout 写。
    if (reply && reply.trim()) {
      let meaningful = true;
      try {
        const parsedReply = JSON.parse(reply);
        meaningful = parsedReply && typeof parsedReply === 'object' && Object.keys(parsedReply).length > 0;
      } catch {
        meaningful = false;
      }
      if (meaningful) process.stdout.write(reply);
    }
  } catch {
    // 有意吞掉
  }
})();
