const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const { createState } = require('./state');
const { createServer } = require('./server');
const { loadRules } = require('./classify');
const { cachedJsonReader, createLogger, cleanupOldLogs } = require('./storage');

const CONFIG_PATH = path.join(__dirname, 'pet.config.json');
const RULES_PATH = path.join(__dirname, 'tool-rules.json');
const POS_PATH = path.join(__dirname, 'state', 'position.json');
const LOGS_DIR = path.join(__dirname, 'logs');

// 原型控制：从命令行指定初始状态，例如 `npm start -- --state=alert`
const stateArg = process.argv.find((a) => a.startsWith('--state='));
if (stateArg) process.env.PET_INITIAL_STATE = stateArg.split('=')[1];

// 原型控制：`--shot=<png> [--shot-delay=<ms>]` 把窗口内容存成图片后退出，用于无桌面环境下核对渲染。
const shotArg = process.argv.find((a) => a.startsWith('--shot='));
const shotDelayArg = process.argv.find((a) => a.startsWith('--shot-delay='));
const SHOT_PATH = shotArg ? shotArg.slice('--shot='.length) : null;
const SHOT_DELAY = shotDelayArg ? Number(shotDelayArg.split('=')[1]) : 1200;

const getConfig = cachedJsonReader(CONFIG_PATH);

// 规则文件改坏了不拖垮分类：保留上一份好规则。
let rulesCache = null;
function getRules() {
  try {
    rulesCache = loadRules(RULES_PATH);
  } catch (err) {
    console.error('tool-rules.json 读取失败：', err.message);
    if (!rulesCache) rulesCache = { readTools: new Set(), writeTools: new Set(), bashWrite: [], bashRead: [] };
  }
  return rulesCache;
}

const logger = createLogger(LOGS_DIR);
const state = createState({ getConfig, getRules, logger: (id, rec) => logger.write(id, rec) });

function loadPosition() {
  if (!getConfig().behavior?.rememberPosition) return null;
  try {
    const p = JSON.parse(fs.readFileSync(POS_PATH, 'utf8'));
    if (Number.isFinite(p.x) && Number.isFinite(p.y)) return clampToDisplay(p);
  } catch {}
  return null;
}

// 把窗口拉回离它最近的显示器工作区：换显示器、缩放变化、拔掉副屏后
// 上次保存的位置可能整块落在屏幕外，宠物会「消失」。
function clampToDisplay(pos) {
  const config = getConfig();
  const { width = 240, height = 240 } = config.window || {};
  const displays = screen.getAllDisplays();
  const center = { x: pos.x + width / 2, y: pos.y + height / 2 };
  const nearest = displays.reduce((best, d) => {
    const b = d.workArea;
    const dx = Math.max(b.x - center.x, 0, center.x - (b.x + b.width));
    const dy = Math.max(b.y - center.y, 0, center.y - (b.y + b.height));
    const dist = dx * dx + dy * dy;
    return !best || dist < best.dist ? { d, dist } : best;
  }, null)?.d || screen.getPrimaryDisplay();

  const area = nearest.workArea;
  return {
    x: Math.min(Math.max(pos.x, area.x), area.x + area.width - width),
    y: Math.min(Math.max(pos.y, area.y), area.y + area.height - height)
  };
}

function savePosition(win) {
  if (!getConfig().behavior?.rememberPosition) return;
  try {
    const [x, y] = win.getPosition();
    fs.mkdirSync(path.dirname(POS_PATH), { recursive: true });
    fs.writeFileSync(POS_PATH, JSON.stringify({ x, y }), 'utf8');
  } catch (err) {
    console.error('位置保存失败：', err.message);
  }
}

let win = null;
let movedSaveTimer = null;


function broadcast() {
  if (win && !win.isDestroyed()) {
    win.webContents.send('pet-state', state.aggregate());
  }
}

function createWindow() {
  const config = getConfig();
  const { width = 240, height = 240, petSize = 170 } = config.window || {};
  const saved = loadPosition();
  const { workArea } = screen.getPrimaryDisplay();
  const startPos = saved || {
    x: workArea.x + workArea.width - width - 40,
    y: workArea.y + workArea.height - height - 80
  };

  win = new BrowserWindow({
    width,
    height,
    x: startPos.x,
    y: startPos.y,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // 'screen-saver' 是 Windows 上能压住普通窗口的层级；普通 'floating' 会被部分全屏/置顶窗口盖住。
  if (config.behavior?.alwaysOnTop !== false) {
    win.setAlwaysOnTop(true, 'screen-saver');
  }
  win.setVisibleOnAllWorkspaces(true);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'), { query: { size: String(petSize) } });
  win.once('ready-to-show', () => {
    win.showInactive();
    broadcast();
  });
  win.on('closed', () => { win = null; });
  // 拖动区（-webkit-app-region: drag）在 Windows 上等同于标题栏，右键会弹系统菜单
  // （还原 / 移动 / 大小 / 最小化 / 关闭）。拦下它，换成本应用自己的菜单。
  win.on('system-context-menu', (event) => {
    event.preventDefault();
    showPetMenu();
  });
  // 位置落盘防抖：拖动时每次移动都会触发，等停稳再写。
  win.on('moved', () => {
    if (movedSaveTimer) clearTimeout(movedSaveTimer);
    movedSaveTimer = setTimeout(() => { if (win) savePosition(win); }, 500);
  });

  if (SHOT_PATH) {
    win.webContents.once('did-finish-load', () => {
      if (process.env.PET_SHOT_MENU === '1') {
        // 截图用：在宠物中心模拟一次右键，把菜单也拍进去。
        win.webContents.executeJavaScript(
          `document.getElementById('pet').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 120, clientY: 150 }))`
        ).catch(() => {});
      }
      setTimeout(async () => {
        try {
          const image = await win.webContents.capturePage();
          fs.writeFileSync(SHOT_PATH, image.toPNG());
          console.log('shot saved:', SHOT_PATH);
        } catch (err) {
          console.error('shot failed:', err.message);
        }
        app.quit();
      }, SHOT_DELAY);
    });
  }

  // 不切换点击穿透：窗口所在的整块区域接管鼠标。
  // 宠物本体是 CSS 拖动区（-webkit-app-region: drag），由系统移动窗口、不会漂移；
  // 「更多」放在气泡这一行，可点。
}

ipcMain.on('request-state', (e) => {
  e.sender.send('pet-state', state.aggregate());
});

// 右键菜单用系统原生菜单：不占透明窗口的版面，也不会和气泡抢位置。
function showPetMenu() {
  if (!win) return;
  const menu = Menu.buildFromTemplate([
    { label: '重启桌宠', click: () => restartApp() },
    { label: '退出', click: () => app.quit() }
  ]);
  menu.popup({ window: win });
}

function restartApp() {
  if (win) savePosition(win);
  app.relaunch();
  app.exit(0);
}

ipcMain.on('restart', restartApp);

ipcMain.on('quit', () => app.quit());

function startServer() {
  const config = getConfig();
  const port = Number(config.port) || 47900;
  const server = createServer({
    state,
    onUpdate: broadcast,
    onQuit: () => app.quit()
  });

  server.on('error', (err) => {
    // 端口被占就直接退出：换了端口钩子就找不到桌宠了。
    console.error(`桌宠服务启动失败（端口 ${port}）：${err.message}`);
    app.quit();
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`桌宠服务监听 http://127.0.0.1:${port}`);
  });

  return server;
}

app.whenReady().then(() => {
  const config = getConfig();
  cleanupOldLogs(LOGS_DIR, Number(config.logs?.keepDays) || 7);
  // 截图模式不占端口，便于和正在运行的桌宠并存。
  if (!SHOT_PATH) startServer();
  createWindow();

  // 换显示器 / 改缩放 / 拔掉副屏后，把宠物拉回可见区域。
  const reClamp = () => {
    if (!win) return;
    const [x, y] = win.getPosition();
    const clamped = clampToDisplay({ x, y });
    if (clamped.x !== x || clamped.y !== y) {
      win.setPosition(clamped.x, clamped.y);
      savePosition(win);
    }
  };
  screen.on('display-removed', reClamp);
  screen.on('display-added', reClamp);
  screen.on('display-metrics-changed', reClamp);

  // 展示用空闲降级：没有事件时也要让宠物从「工作中」回落。
  setInterval(() => {
    if (state.tick()) broadcast();
  }, 30 * 1000);
});

app.on('window-all-closed', () => {
  logger.close();
  app.quit();
});
