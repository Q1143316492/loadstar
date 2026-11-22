#!/usr/bin/env node
// 启动桌宠。直接跑 electron.exe 会被环境里的 ELECTRON_RUN_AS_NODE 带偏
// （那会让 Electron 以纯 Node 模式运行，拿不到 app 对象），这里先清掉再拉起。
//
//   node bin/start.js            前台运行，终端里能看到日志
//   node bin/start.js --detach   后台运行，日志写 state/pet.out，命令立即返回
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const appDir = path.join(__dirname, '..');
const electron = path.join(appDir, 'node_modules', 'electron', 'dist',
  process.platform === 'win32' ? 'electron.exe' : 'electron');

const detach = process.argv.includes('--detach');
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

let stdio = 'inherit';
let outFd = null;
if (detach) {
  // 脱离时不能继承父进程的管道，否则调用方要等桌宠退出才返回。
  const logPath = path.join(appDir, 'state', 'pet.out');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  outFd = fs.openSync(logPath, 'a');
  stdio = ['ignore', outFd, outFd];
}

const args = [appDir, ...process.argv.slice(2).filter((a) => a !== '--detach')];
const child = spawn(electron, args, { cwd: appDir, env, stdio, detached: detach });

if (detach) {
  child.unref();
  if (outFd !== null) fs.closeSync(outFd);
  console.log(`桌宠已在后台启动，日志：${path.join(appDir, 'state', 'pet.out')}`);
} else {
  child.on('exit', (code) => process.exit(code ?? 0));
}
