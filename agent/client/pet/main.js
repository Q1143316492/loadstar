const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const { createState } = require('./state');
const { createServer } = require('./server');
const { loadRules } = require('./classify');
const { createConfigLoader } = require('./config');
const { createLogger, cleanupOldLogs } = require('./storage');

const CONFIG_PATH = path.join(__dirname, 'pet.config.json');
const RULES_PATH = path.join(__dirname, 'tool-rules.json');
const POS_PATH = path.join(__dirname, 'state', 'position.json');
const getConfig = createConfigLoader(CONFIG_PATH);
// 日志目录与保留天数都来自配置；改目录要重启，改天数下次启动生效。
const LOGS_DIR = path.join(__dirname, getConfig().logs.dir);

// 原型控制：从命令行指定初始状态，例如 `npm start -- --state=alert`
const stateArg = process.argv.find((a) => a.startsWith('--state='));
if (stateArg) process.env.PET_INITIAL_STATE = stateArg.split('=')[1];

// 原型控制：`--chat` 直接以展开的对话卡启动，用于截图核对。
if (process.argv.includes('--chat')) process.env.PET_INITIAL_CHAT = '1';

// 原型控制：`--shot=<png> [--shot-delay=<ms>]` 把窗口内容存成图片后退出，用于无桌面环境下核对渲染。
const shotArg = process.argv.find((a) => a.startsWith('--shot='));
const shotDelayArg = process.argv.find((a) => a.startsWith('--shot-delay='));
const SHOT_PATH = shotArg ? shotArg.slice('--shot='.length) : null;
const SHOT_DELAY = shotDelayArg ? Number(shotDelayArg.split('=')[1]) : 1200;

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
  if (!getConfig().behavior.rememberPosition) return null;
  try {
    const p = JSON.parse(fs.readFileSync(POS_PATH, 'utf8'));
    if (Number.isFinite(p.x) && Number.isFinite(p.y)) return clampToDisplay(p);
  } catch {}
  return null;
}

// 把窗口拉回离它最近的显示器工作区：换显示器、缩放变化、拔掉副屏后
// 上次保存的位置可能整块落在屏幕外，宠物会「消失」。
function clampToDisplay(pos, size = getConfig().window) {
  const { width, height } = size;
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
  if (!getConfig().behavior.rememberPosition) return;
  try {
    const collapsed = getConfig().window;
    // 存的是收起状态的左上角：从宠物锚点推算，展开 / 收起来回切都不会漂。
    const left = petAnchor
      ? petAnchor.right + (collapsed.width - getConfig().window.petSize) / 2 - collapsed.width
      : win.getBounds().x;
    const top = petAnchor ? petAnchor.bottom + PET_BOTTOM_MARGIN - collapsed.height : win.getBounds().y;
    fs.mkdirSync(path.dirname(POS_PATH), { recursive: true });
    fs.writeFileSync(POS_PATH, JSON.stringify({ x: left, y: top }), 'utf8');
  } catch (err) {
    console.error('位置保存失败：', err.message);
  }
}

let win = null;
let movedSaveTimer = null;
let programmaticMove = false;
// 对话卡展开时窗口变宽变高；收起后回到 pet.config.json 的窗口尺寸。
let chatOpen = process.env.PET_INITIAL_CHAT === '1';

const CHAT_WIDTH = 520;
// 与 style.css 保持一致：宠物底边距两态相同，右边距展开态固定。
const PET_BOTTOM_MARGIN = 6;
const PET_CHAT_RIGHT_MARGIN = 16;

function chatSize() {
  // 卡片在宠物左侧，高度给卡片留够一屏消息。
  return { width: CHAT_WIDTH, height: Math.max(320, getConfig().window.petSize + 300) };
}

// 宠物在屏幕上的右边缘：收起态窗口里居中，展开态贴右侧固定边距。
function petRightMargin(width) {
  const petSize = getConfig().window.petSize;
  return chatOpen ? PET_CHAT_RIGHT_MARGIN : (width - petSize) / 2;
}

// 宠物右下角在屏幕上的锚点。展开 / 收起都从它推算窗口位置，
// 不会因为每次都用「当前窗口边界」反推而累积 1–2px 的 DPI 取整漂移。
let petAnchor = null;

function anchorFromBounds(bounds) {
  const margin = petRightMargin(bounds.width);
  return {
    right: bounds.x + bounds.width - margin,
    bottom: bounds.y + bounds.height - PET_BOTTOM_MARGIN
  };
}

function boundsForPetAnchor(target) {
  const margin = petRightMargin(target.width);
  return {
    x: petAnchor.right + margin - target.width,
    y: petAnchor.bottom + PET_BOTTOM_MARGIN - target.height,
    width: target.width,
    height: target.height
  };
}


function broadcast() {
  if (win && !win.isDestroyed()) {
    win.webContents.send('pet-state', state.aggregate());
  }
}

function createWindow() {
  const config = getConfig();
  const { width, height, petSize } = chatOpen ? { ...chatSize(), petSize: config.window.petSize } : config.window;
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
    petAnchor = anchorFromBounds(win.getBounds());
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
    // 自己 setBounds 引起的 moved 不算用户拖动：按实际边界重算锚点会把 DPI 取整误差带进来。
    if (programmaticMove) { programmaticMove = false; return; }
    petAnchor = anchorFromBounds(win.getBounds());
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

// 展开 / 收起对话卡：锚定宠物右下角，宠物在屏幕上原地不动，窗口向它左上展开。
ipcMain.on('chat-toggle', (_e, open) => {
  if (!win || chatOpen === !!open) return;
  if (!petAnchor) petAnchor = anchorFromBounds(win.getBounds());

  chatOpen = !!open;
  const target = chatOpen ? chatSize() : getConfig().window;
  const next = boundsForPetAnchor(target);
  const clamped = clampToDisplay({ x: next.x, y: next.y }, target);
  programmaticMove = true;
  win.setBounds({ x: clamped.x, y: clamped.y, width: target.width, height: target.height }, false);
  // 锚点按「请求的边界」更新；夹回可见区域时用实际落点。
  petAnchor = anchorFromBounds(
    clamped.x === next.x && clamped.y === next.y
      ? { ...next, width: target.width, height: target.height }
      : { ...clamped, width: target.width, height: target.height }
  );
  setTimeout(() => { programmaticMove = false; }, 300);

  // 展开后要能直接打字；收起后把键盘还回去。
  if (chatOpen) win.focus();
  else win.showInactive();
  win.webContents.send('pet-chat', chatOpen);
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
  const port = config.port;
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
  cleanupOldLogs(LOGS_DIR, config.logs.keepDays);
  // 截图模式不占端口，便于和正在运行的桌宠并存。
  if (!SHOT_PATH) startServer();
  createWindow();

  // 换显示器 / 改缩放 / 拔掉副屏后，把宠物拉回可见区域。
  const reClamp = () => {
    if (!win) return;
    const [x, y] = win.getPosition();
    const [width, height] = win.getSize();
    const clamped = clampToDisplay({ x, y }, { width, height });
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
