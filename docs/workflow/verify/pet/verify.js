#!/usr/bin/env node
// cwl-pet 验证助手：起一个与日常桌宠并存的隔离实例，像用户那样驱动它，取证，收场。
//
//   node docs/workflow/verify/pet/verify.js launch
//   node docs/workflow/verify/pet/verify.js doctor --run <RUN_DIR>
//   node docs/workflow/verify/pet/verify.js snap --run <RUN_DIR> --png <file>
//   node docs/workflow/verify/pet/verify.js cleanup --run <RUN_DIR>
//
// 每个命令都把 --run <RUN_DIR>（launch 打印的那个目录）或环境变量 PET_VERIFY_RUN 当作实例身份。
// 助手只碰自己启动的实例：端口来自 run.json，退出按 run.json 里的 pid 收尾。

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const SOURCE_DIR = path.join(REPO_ROOT, 'agent', 'client', 'pet');
const ELECTRON_BIN = process.platform === 'win32'
  ? path.join(SOURCE_DIR, 'node_modules', 'electron', 'dist', 'electron.exe')
  : path.join(SOURCE_DIR, 'node_modules', 'electron', 'dist', 'electron');
const SOURCE_FILES = [
  'main.js', 'preload.js', 'server.js', 'state.js', 'storage.js', 'classify.js', 'config.js',
  'pet.config.json', 'tool-rules.json', 'package.json', 'renderer', 'assets'
];
const DEFAULT_ROOT = path.join(os.tmpdir(), 'pet-verify');
const READY_TIMEOUT_MS = 20000;

// ---------- 参数 ----------

function parseArgs(argv) {
  const positional = [];
  const values = new Map();
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const [name, inline] = token.slice(2).split('=');
      if (inline !== undefined) {
        values.set(name, inline);
      } else if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
        values.set(name, argv[++i]);
      } else {
        values.set(name, true);
      }
    } else {
      positional.push(token);
    }
  }
  return { positional, values };
}

const { positional, values } = parseArgs(process.argv.slice(2));
const command = positional[0];
const value = (name, fallback) => (values.has(name) ? values.get(name) : fallback);
const flag = (name) => values.get(name) === true || values.get(name) === 'true';

// ---------- 小工具 ----------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fail(message) {
  console.error(message);
  process.exit(1);
}

function jsonPretty(value) {
  return JSON.stringify(value, null, 2);
}

function runDirFromArgs({ required = true } = {}) {
  const dir = value('run') || process.env.PET_VERIFY_RUN;
  if (!dir) {
    if (required) fail('缺少 --run <RUN_DIR>（或环境变量 PET_VERIFY_RUN）。launch 会打印它。');
    return null;
  }
  return path.resolve(String(dir));
}

function loadRun(runDir) {
  const file = path.join(runDir, 'run.json');
  if (!fs.existsSync(file)) fail(`${runDir} 不是验证实例目录：缺 run.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function httpJson(port, method, urlPath, body, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : Buffer.from(JSON.stringify(body));
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path: urlPath,
        method,
        timeout: timeoutMs,
        headers: payload
          ? { 'Content-Type': 'application/json', 'Content-Length': payload.length }
          : {}
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null, raw: data });
          } catch {
            resolve({ status: res.statusCode, body: null, raw: data });
          }
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error(`超时：${method} ${urlPath}`)));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function healthOk(port) {
  try {
    const res = await httpJson(port, 'GET', '/health', undefined, 1500);
    return res.status === 200 && res.body && res.body.ok === true;
  } catch {
    return false;
  }
}

function pidAlive(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function killTree(pid) {
  if (!pidAlive(pid)) return false;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try { process.kill(-pid, 'SIGKILL'); } catch { try { process.kill(pid, 'SIGKILL'); } catch {} }
  }
  return true;
}

async function waitFor(check, timeoutMs, intervalMs = 200) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const result = await check();
      if (result) return result;
    } catch {}
    await sleep(intervalMs);
  }
  return null;
}

function readJsonFile(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
}

function writeJsonFile(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, jsonPretty(value) + '\n', 'utf8');
}

function readConfig(appDir) {
  return readJsonFile(path.join(appDir, 'pet.config.json'));
}

function writeConfig(appDir, config) {
  writeJsonFile(path.join(appDir, 'pet.config.json'), config);
}

function setByPath(object, keyPath, next) {
  const keys = keyPath.split('.');
  let cursor = object;
  for (const key of keys.slice(0, -1)) {
    if (cursor[key] === null || typeof cursor[key] !== 'object') cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[keys[keys.length - 1]] = next;
}

function parseConfigValue(raw) {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return raw;
}

function gitInfo() {
  const rev = spawnSync('git', ['-C', SOURCE_DIR, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' });
  const dirty = spawnSync('git', ['-C', SOURCE_DIR, 'status', '--porcelain', '--', '.'], { encoding: 'utf8' });
  return {
    rev: rev.status === 0 ? rev.stdout.trim() : null,
    dirty: dirty.status === 0 ? dirty.stdout.trim().length > 0 : null
  };
}

// ---------- CDP ----------

async function cdpConnect(debugPort, appDir, { timeoutMs = 8000 } = {}) {
  const page = await waitFor(async () => {
    const list = await httpJson(debugPort, 'GET', '/json/list', undefined, 1000);
    const pages = Array.isArray(list.body) ? list.body : [];
    return pages.find((t) => t.type === 'page' && typeof t.url === 'string' && t.url.includes(appDir.replace(/\\/g, '/')));
  }, timeoutMs, 250);
  if (!page) throw new Error(`${debugPort} 上没有本实例的渲染页`);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('CDP 连接超时')), 5000);
    ws.onopen = () => { clearTimeout(timer); resolve(); };
    ws.onerror = () => { clearTimeout(timer); reject(new Error('CDP 连接失败')); };
  });

  let seq = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    let message;
    try { message = JSON.parse(event.data); } catch { return; }
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP ${method} 超时`));
    }, 5000);
    pending.set(id, {
      resolve: (result) => { clearTimeout(timer); resolve(result); },
      reject: (err) => { clearTimeout(timer); reject(err); }
    });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    }
    return result.result.value;
  };
  const snapshot = () => evaluate(`(() => {
    const text = (id) => { const el = document.getElementById(id); return el ? el.textContent : null; };
    const hidden = (id) => { const el = document.getElementById(id); return el ? el.classList.contains('hidden') : null; };
    const pet = document.getElementById('pet').getBoundingClientRect();
    const active = document.activeElement;
    return JSON.stringify({
      state: document.getElementById('pet').dataset.state,
      img: document.getElementById('pet-img').src.split('/').pop(),
      bubble: text('bubble-text'),
      bubbleHidden: hidden('bubble'),
      chatHidden: hidden('chat'),
      chatStatus: text('chat-status'),
      unread: document.getElementById('chat-open').classList.contains('unread'),
      inputValue: document.getElementById('chat-input').value,
      focus: active ? (active.id || active.className || active.tagName) : null,
      messages: [...document.querySelectorAll('.chat-msg')].map((el) => el.textContent),
      window: { x: window.screenX, y: window.screenY, width: window.outerWidth, height: window.outerHeight },
      pet: { x: pet.x, y: pet.y, width: pet.width, height: pet.height }
    });
  })()`);
  const shot = async (file) => {
    const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    fs.writeFileSync(file, Buffer.from(result.data, 'base64'));
    return file;
  };
  const rect = (selector) => evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, width: r.width, height: r.height };
  })()`);
  const click = async (selector) => {
    const target = await rect(selector);
    if (!target) throw new Error(`找不到元素：${selector}`);
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', {
        type, x: target.x, y: target.y, button: 'left', clickCount: 1
      });
    }
  };
  const key = async (name) => {
    const known = {
      Escape: { code: 'Escape', keyCode: 27 },
      Enter: { code: 'Enter', keyCode: 13 },
      Tab: { code: 'Tab', keyCode: 9 }
    }[name];
    if (!known) throw new Error(`不支持的键：${name}`);
    let error = null;
    for (const type of ['rawKeyDown', 'keyUp']) {
      try {
        await send('Input.dispatchKeyEvent', { type, key: name, code: known.code, windowsVirtualKeyCode: known.keyCode });
      } catch (err) {
        // 收起态的 Esc 会让应用退出：keyUp 等不到回包是预期现象。
        error = err;
      }
    }
    return { error: error ? error.message : null };
  };
  const typeText = (text) => send('Input.insertText', { text });

  return { send, evaluate, snapshot, shot, rect, click, key, typeText, close: () => ws.close() };
}

// ---------- 证据 ----------

function evidenceDirOf(run) {
  return run.evidenceDir;
}

async function captureEvidence(run, label, { png = true } = {}) {
  const dir = evidenceDirOf(run);
  fs.mkdirSync(dir, { recursive: true });
  const files = {};

  const state = await httpJson(run.port, 'GET', '/state');
  files.state = path.join(dir, `${label}.state.json`);
  writeJsonFile(files.state, state.body);

  const cdp = await cdpConnect(run.debugPort, run.appDir);
  try {
    files.dom = path.join(dir, `${label}.dom.json`);
    writeJsonFile(files.dom, JSON.parse(await cdp.snapshot()));
    if (png) {
      files.png = path.join(dir, `${label}.png`);
      await cdp.shot(files.png);
    }
  } finally {
    cdp.close();
  }
  return files;
}

// ---------- 命令：launch ----------

async function copyApp(appDir) {
  fs.mkdirSync(appDir, { recursive: true });
  for (const name of SOURCE_FILES) {
    const from = path.join(SOURCE_DIR, name);
    const to = path.join(appDir, name);
    if (!fs.existsSync(from)) fail(`源码缺件：${from}`);
    fs.cpSync(from, to, { recursive: true });
  }
  fs.writeFileSync(path.join(appDir, '.verify-instance'), '由 docs/workflow/verify/pet/verify.js 启动的隔离实例\n', 'utf8');
}

async function launch() {
  if (!fs.existsSync(ELECTRON_BIN)) {
    fail(`找不到 Electron：${ELECTRON_BIN}\n先在 agent/client/pet 下 npm install。`);
  }

  const runId = value('id') || `${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 6)}`;
  const runDir = path.resolve(String(value('run') || path.join(DEFAULT_ROOT, runId)));
  const evidenceDir = path.resolve(String(value('evidence') || path.join(runDir, 'evidence')));

  // 同一个 run 目录里已有活实例：拒绝双重驱动。
  if (fs.existsSync(path.join(runDir, 'run.json'))) {
    const previous = loadRun(runDir);
    if (await healthOk(previous.port)) {
      fail(`${runDir} 里已有实例在跑（端口 ${previous.port}）。先 cleanup，或换一个 --run。`);
    }
    fs.rmSync(path.join(runDir, 'app'), { recursive: true, force: true });
    fs.rmSync(path.join(runDir, 'profile'), { recursive: true, force: true });
    fs.rmSync(path.join(runDir, 'pet.out'), { force: true });
  }
  fs.mkdirSync(runDir, { recursive: true });
  fs.mkdirSync(evidenceDir, { recursive: true });

  const appDir = path.join(runDir, 'app');
  await copyApp(appDir);

  const config = readConfig(appDir);
  config.port = await freePort();
  writeConfig(appDir, config);
  const debugPort = await freePort();

  const outFile = path.join(runDir, 'pet.out');
  const outFd = fs.openSync(outFile, 'a');
  const env = { ...process.env };
  // 这个变量会让 Electron 以纯 Node 模式运行，拿不到 app 对象。
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(
    ELECTRON_BIN,
    [`--remote-debugging-port=${debugPort}`, `--user-data-dir=${path.join(runDir, 'profile')}`, appDir],
    { cwd: appDir, env, detached: true, stdio: ['ignore', outFd, outFd] }
  );
  fs.closeSync(outFd);
  child.unref();

  const baseRun = {
    runId: path.basename(runDir),
    runDir,
    appDir,
    sourceDir: SOURCE_DIR,
    evidenceDir,
    port: config.port,
    debugPort,
    pid: child.pid,
    launchedAt: new Date().toISOString(),
    git: gitInfo(),
    config
  };

  const healthy = await waitFor(() => healthOk(config.port), READY_TIMEOUT_MS);
  let cdp = null;
  let usable = false;
  if (healthy) {
    try {
      cdp = await cdpConnect(debugPort, appDir);
      usable = await waitFor(async () => {
        const ready = await cdp.evaluate(`document.readyState === 'complete' && !!document.getElementById('pet') && typeof window.petAPI === 'object'`);
        return ready === true;
      }, 5000);
    } catch {}
  }

  if (!healthy || !usable) {
    if (cdp) cdp.close();
    killTree(child.pid);
    const tail = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8').split('\n').slice(-15).join('\n') : '';
    fail(`实例没有起来。\n端口 ${config.port} health=${healthy}，渲染页就绪=${usable}\n${outFile} 尾部：\n${tail}`);
  }

  const dom = JSON.parse(await cdp.snapshot());
  cdp.close();

  writeJsonFile(path.join(runDir, 'run.json'), baseRun);
  console.log(jsonPretty({
    ok: true,
    runDir,
    evidenceDir,
    port: config.port,
    debugPort,
    pid: child.pid,
    state: dom.state,
    next: `node docs/workflow/verify/pet/verify.js doctor --run "${runDir}"`
  }));
}

// ---------- 命令：doctor ----------

async function doctor() {
  const runDir = runDirFromArgs();
  const run = loadRun(runDir);
  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok, detail });

  add('pid', pidAlive(run.pid), `pid ${run.pid}`);
  add('health', await healthOk(run.port), `http://127.0.0.1:${run.port}/health`);

  let aggregate = null;
  try {
    const res = await httpJson(run.port, 'GET', '/state');
    aggregate = res.body;
    add('state', res.status === 200 && aggregate && typeof aggregate.main?.state === 'string' && typeof aggregate.sessions === 'number',
      aggregate ? `main=${aggregate.main.state} sessions=${aggregate.sessions} alerts=${aggregate.alerts}` : '无响应');
  } catch (err) {
    add('state', false, err.message);
  }

  let cdpOk = false;
  let dom = null;
  if (run.debugPort) {
    try {
      const cdp = await cdpConnect(run.debugPort, run.appDir, { timeoutMs: 3000 });
      try {
        dom = JSON.parse(await cdp.snapshot());
        cdpOk = ['idle', 'working', 'alert'].includes(dom.state);
      } finally {
        cdp.close();
      }
    } catch (err) {
      add('cdp', false, err.message);
    }
    if (dom) add('cdp', cdpOk, `title=cwl-pet url 指向 run 里的 app 目录，DOM state=${dom.state}`);
  } else {
    add('cdp', false, 'run.json 没有 debugPort');
  }

  let config = null;
  try {
    config = readConfig(run.appDir);
    add('config.port', config.port === run.port, `启动端口 ${run.port}，当前配置 ${config.port}（端口只在启动时读）`);
    add('config.pet-toggle', config.toggles?.pet !== false, 'toggles.pet 必须为 true，否则窗口永远显示 idle，状态验证无从证明');
  } catch (err) {
    add('config', false, err.message);
  }

  add('evidence-dir', fs.existsSync(run.evidenceDir), run.evidenceDir);
  if (run.git && run.git.dirty) {
    add('note-dirty-tree', true, '启动时 agent/client/pet 有未提交改动——证据只对这份工作树成立');
  }
  add('note-isolated', path.resolve(run.appDir).startsWith(path.resolve(run.runDir)), '实例从 run 目录里的副本启动，不碰日常桌宠与它的日志');

  const ok = checks.every((check) => check.ok);
  const result = {
    ok,
    run: { runDir: run.runDir, port: run.port, debugPort: run.debugPort, pid: run.pid },
    dom,
    config: config
      ? {
          thresholds: config.thresholds,
          toggles: config.toggles,
          nudgeText: config.nudge?.text || '',
          systemMessage: config.nudge?.systemMessage || ''
        }
      : null,
    checks
  };
  console.log(jsonPretty(result));
  if (!ok) process.exit(1);
}

// ---------- 命令：驱动 ----------

function requireRun() {
  const runDir = runDirFromArgs();
  const run = loadRun(runDir);
  return run;
}

async function state() {
  const run = requireRun();
  const res = await httpJson(run.port, 'GET', '/state');
  console.log(jsonPretty(res.body));
}

async function event() {
  const run = requireRun();
  let payload;
  if (value('json')) {
    payload = JSON.parse(String(value('json')));
  } else {
    if (!value('event') || !value('session')) fail('需要 --json '<payload>'，或 --event 与 --session');
    payload = { event: String(value('event')), session_id: String(value('session')) };
    if (value('cwd')) payload.cwd = String(value('cwd'));
    if (value('tool')) payload.tool_name = String(value('tool'));
    if (value('title')) payload.session_title = String(value('title'));
    if (flag('stop-active')) payload.stop_hook_active = true;
  }
  const res = await httpJson(run.port, 'POST', '/event', payload);
  console.log(jsonPretty({ status: res.status, reply: res.body }));
}

async function withCdp(fn) {
  const run = requireRun();
  const cdp = await cdpConnect(run.debugPort, run.appDir);
  try {
    return await fn(cdp, run);
  } finally {
    cdp.close();
  }
}

async function dom() {
  await withCdp(async (cdp) => {
    console.log(jsonPretty(JSON.parse(await cdp.snapshot())));
  });
}

async function snap() {
  await withCdp(async (cdp) => {
    const snapshot = JSON.parse(await cdp.snapshot());
    const png = value('png');
    if (png) await cdp.shot(String(png));
    console.log(jsonPretty({ ...snapshot, png: png ? path.resolve(String(png)) : null }));
  });
}

async function click() {
  const selector = String(value('selector') || '');
  if (!selector) fail('需要 --selector <CSS 选择器>');
  await withCdp(async (cdp) => {
    await cdp.click(selector);
    await sleep(350);
    console.log(jsonPretty(JSON.parse(await cdp.snapshot())));
  });
}

async function type() {
  const text = value('text');
  if (text === undefined) fail('需要 --text <内容>');
  await withCdp(async (cdp) => {
    await cdp.typeText(String(text));
    await sleep(150);
    console.log(jsonPretty(JSON.parse(await cdp.snapshot())));
  });
}

async function key() {
  const name = String(value('key') || '');
  if (!name) fail('需要 --key Escape|Enter|Tab');
  await withCdp(async (cdp) => {
    const result = await cdp.key(name);
    // 收起态的 Esc 会直接退出应用：页面马上消失，快照必然失败。
    if (flag('no-snapshot')) {
      console.log(jsonPretty({ key: name, snapshot: 'skipped', pageGone: Boolean(result.error) }));
      return;
    }
    await sleep(400);
    console.log(jsonPretty(JSON.parse(await cdp.snapshot())));
  });
}

async function configure() {
  const run = requireRun();
  if (flag('reset')) {
    const repoConfig = readConfig(SOURCE_DIR);
    repoConfig.port = run.port;
    writeConfig(run.appDir, repoConfig);
    console.log(jsonPretty(readConfig(run.appDir)));
    return;
  }
  const sets = [];
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--set' && process.argv[i + 1]) sets.push(process.argv[++i]);
  }
  if (sets.length === 0) fail('需要 --set <键>=<值>（可多次），或 --reset');
  const config = readConfig(run.appDir);
  for (const pair of sets) {
    const index = pair.indexOf('=');
    if (index <= 0) fail(`--set 需要 键=值：${pair}`);
    setByPath(config, pair.slice(0, index), parseConfigValue(pair.slice(index + 1)));
  }
  writeConfig(run.appDir, config);
  console.log(jsonPretty({ saved: path.join(run.appDir, 'pet.config.json'), hotReloadMs: 1000, config }));
}

async function evidence() {
  const run = requireRun();
  const label = String(value('label') || '');
  if (!label) fail('需要 --label <名字>');
  const files = await captureEvidence(run, label, { png: !flag('no-png') });
  console.log(jsonPretty({ label, files }));
}

function logs() {
  const run = requireRun();
  const dir = path.join(run.appDir, 'logs');
  console.log(jsonPretty({
    dir,
    files: fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => n.endsWith('.jsonl')) : []
  }));
}

// ---------- 命令：收场 ----------

async function quit({ quiet = false } = {}) {
  const run = requireRun();
  let posted = false;
  try {
    await httpJson(run.port, 'POST', '/quit', {}, 2000);
    posted = true;
  } catch {}
  const stopped = await waitFor(async () => !(await healthOk(run.port)), 5000, 200);
  if (!stopped) killTree(run.pid);
  const dead = await waitFor(() => !pidAlive(run.pid), 3000, 200);
  if (!quiet) {
    console.log(jsonPretty({
      posted,
      portDown: !(await healthOk(run.port)),
      pidAlive: pidAlive(run.pid),
      stoppedCleanly: !!(stopped && dead)
    }));
  }
}

async function cleanup() {
  const runDir = runDirFromArgs();
  const run = loadRun(runDir);
  fs.mkdirSync(run.evidenceDir, { recursive: true });

  if (await healthOk(run.port)) {
    try {
      const files = await captureEvidence(run, 'final', { png: true });
      console.error(`final evidence: ${files.dom}`);
    } catch (err) {
      console.error(`final evidence 失败：${err.message}`);
    }
  }

  // 日志是证据：收场前搬进证据目录。
  const logsDir = path.join(run.appDir, 'logs');
  if (fs.existsSync(logsDir)) {
    const target = path.join(run.evidenceDir, 'logs');
    fs.mkdirSync(target, { recursive: true });
    for (const name of fs.readdirSync(logsDir)) {
      if (!name.endsWith('.jsonl')) continue;
      fs.copyFileSync(path.join(logsDir, name), path.join(target, name));
    }
  }

  await quit({ quiet: true });
  fs.rmSync(run.appDir, { recursive: true, force: true });
  fs.rmSync(path.join(run.runDir, 'profile'), { recursive: true, force: true });
  fs.rmSync(path.join(run.runDir, 'pet.out'), { force: true });

  console.log(jsonPretty({
    ok: true,
    runDir: run.runDir,
    evidenceDir: run.evidenceDir,
    kept: fs.readdirSync(run.evidenceDir),
    note: '实例与临时状态已删除；证据目录保留'
  }));
}

// ---------- 入口 ----------

const COMMANDS = {
  launch,
  doctor,
  state,
  event,
  dom,
  snap,
  click,
  type,
  key,
  configure,
  evidence,
  logs,
  quit,
  cleanup
};

async function main() {
  if (!command || !COMMANDS[command]) {
    console.log(`用法：node docs/workflow/verify/pet/verify.js <命令> [选项]

命令：
  launch       起一个隔离实例；打印 RUN_DIR、端口、pid
  doctor       只读体检：进程、端口、/state、渲染页、配置
  state        打印 GET /state
  event        发一条钩子事件（--json，或 --event/--session/--tool）
  dom          打印渲染页快照
  snap         快照 + 可选截图（--png）
  click        在渲染页点一个元素（--selector）
  type         向焦点输入文本（--text）
  key          按键（--key Escape|Enter|Tab [--no-snapshot]）
  configure    热改副本配置（--set 键=值，可多次；--reset 还原）
  evidence     取证：<label>.state.json / .dom.json / .png
  logs         打印实例日志目录
  quit         关闭实例（POST /quit，必要时按 pid 收尾）
  cleanup      取证、搬日志、删实例；证据目录保留

所有命令都要 --run <RUN_DIR>，或设 PET_VERIFY_RUN。`);
    process.exit(command ? 1 : 0);
  }
  await COMMANDS[command]();
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
