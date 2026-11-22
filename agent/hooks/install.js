#!/usr/bin/env node
// 把桌宠钩子装进用户级 Claude Code 配置，或从里面卸掉。
//   node install.js             安装
//   node install.js --uninstall 卸载
// 幂等：重复安装不会产生重复条目；卸载只删自己的条目，其他钩子原样保留。

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const HOOK_SCRIPT = path.join(__dirname, 'claude-code-hook.js');
const MARKER = 'claude-code-hook.js';

// 逐次 PostToolUse 提供精确计数；其余四个事件用于会话生命周期、用户发言与回合停顿。
const EVENTS = ['PostToolUse', 'SessionStart', 'SessionEnd', 'UserPromptSubmit', 'Stop'];

// 超时 1 秒：钩子协议最多等 1 秒，桌宠没开时几乎无感。
const HOOK_TIMEOUT_SECONDS = 1;

const isWindows = process.platform === 'win32';
// Claude Code 在 Windows 上也用 POSIX shell 执行命令钩子，反斜杠会被当成转义符吃掉，
// 必须写成正斜杠；cmd 同样接受正斜杠。
const toPosix = (p) => p.replace(/\\/g, '/');
const quote = (p) => (p.includes(' ') ? `"${p}"` : p);
const COMMAND = `${quote(toPosix(process.execPath))} ${quote(toPosix(HOOK_SCRIPT))}`;

function readSettings() {
  if (!fs.existsSync(SETTINGS_PATH)) return {};
  const text = fs.readFileSync(SETTINGS_PATH, 'utf8').replace(/^﻿/, '');
  if (!text.trim()) return {};
  return JSON.parse(text);
}

function writeSettings(settings) {
  fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n', 'utf8');
}

function backup() {
  if (!fs.existsSync(SETTINGS_PATH)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = `${SETTINGS_PATH}.bak-${stamp}`;
  fs.copyFileSync(SETTINGS_PATH, target);
  return target;
}

function isOurEntry(group) {
  return Array.isArray(group?.hooks) && group.hooks.some((h) => String(h?.command || '').includes(MARKER));
}

// 旧版本用过反斜杠路径，这里也要认出来。
function isOurCommand(command) {
  return String(command || '').includes(MARKER);
}

function ourGroup() {
  return {
    hooks: [{ type: 'command', command: COMMAND, timeout: HOOK_TIMEOUT_SECONDS }]
  };
}

function install(settings) {
  settings.hooks = settings.hooks || {};
  const added = [];
  const updated = [];
  for (const event of EVENTS) {
    const groups = Array.isArray(settings.hooks[event]) ? settings.hooks[event] : [];
    let seen = false;
    for (const group of groups) {
      if (!isOurEntry(group) && !(Array.isArray(group?.hooks) && group.hooks.some((h) => isOurCommand(h?.command)))) continue;
      if (seen) continue;
      seen = true;
      if (group.hooks.some((h) => h?.command !== COMMAND)) {
        group.hooks = ourGroup().hooks;
        updated.push(event);
      }
    }
    if (!seen) {
      groups.push(ourGroup());
      added.push(event);
    }
    settings.hooks[event] = groups;
  }
  return { added, updated };
}

function uninstall(settings) {
  if (!settings.hooks) return [];
  const removed = [];
  for (const event of EVENTS) {
    const groups = settings.hooks[event];
    if (!Array.isArray(groups)) continue;
    const kept = groups.filter((g) => !isOurEntry(g));
    if (kept.length !== groups.length) removed.push(event);
    if (kept.length > 0) settings.hooks[event] = kept;
    else delete settings.hooks[event];
  }
  if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
  return removed;
}

function main() {
  const uninstalling = process.argv.includes('--uninstall');

  if (!fs.existsSync(HOOK_SCRIPT)) {
    console.error(`找不到钩子脚本：${HOOK_SCRIPT}`);
    process.exit(1);
  }

  const settings = readSettings();
  const saved = backup();

  if (uninstalling) {
    const changed = uninstall(settings);
    if (changed.length === 0) {
      console.log(`配置里没有本项目的钩子，无需改动：${SETTINGS_PATH}`);
    } else {
      writeSettings(settings);
      console.log('移除完成，涉及事件：');
      for (const event of changed) console.log(`  - ${event}`);
      console.log(`配置文件：${SETTINGS_PATH}`);
    }
  } else {
    const { added, updated } = install(settings);
    if (added.length === 0 && updated.length === 0) {
      console.log(`配置已是最新，无需改动：${SETTINGS_PATH}`);
    } else {
      writeSettings(settings);
      if (added.length > 0) {
        console.log('新增事件：');
        for (const event of added) console.log(`  - ${event}`);
      }
      if (updated.length > 0) {
        console.log('更新了命令的事件：');
        for (const event of updated) console.log(`  - ${event}`);
      }
      console.log(`配置文件：${SETTINGS_PATH}`);
    }
  }

  if (saved) console.log(`原文件已备份：${saved}`);

  console.log('');
  console.log(`钩子命令：${COMMAND}`);
  console.log('改动需要重启 Claude Code 会话才会生效。');
  if (!uninstalling) {
    console.log('');
    console.log('卸载：node install.js --uninstall');
  }
}

main();
