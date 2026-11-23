// 宠物尺寸由主进程按 pet.config.json 的 window.petSize 通过查询参数传进来。
const sizeParam = new URLSearchParams(location.search).get('size');
if (sizeParam && Number(sizeParam) > 0) {
  document.documentElement.style.setProperty('--pet-size', `${sizeParam}px`);
}

const pet = document.getElementById('pet');
const petImg = document.getElementById('pet-img');
const bubble = document.getElementById('bubble');
const bubbleText = document.getElementById('bubble-text');

const chat = document.getElementById('chat');
const chatOpenBtn = document.getElementById('chat-open');
const chatCollapseBtn = document.getElementById('chat-collapse');
const chatClearBtn = document.getElementById('chat-clear');
const chatAvatar = document.getElementById('chat-avatar');
const chatStatus = document.getElementById('chat-status');
const chatList = document.getElementById('chat-list');
const chatEmpty = document.getElementById('chat-empty');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

const ASSETS = {
  idle: '../assets/idle.svg',
  working: '../assets/working.svg',
  alert: '../assets/alert.svg'
};

// 真实状态从主进程来；--state= 只用于原型截图。
const view = {
  state: window.petAPI.initialState || 'idle',
  detail: null,     // 聚合结果里的 main
  sessions: 1,
  alerts: 0,
  chatOpen: window.petAPI.initialChat === true,
  // 你发出的消息，加上桌宠主动发的（目前只有「任务完成」）。
  messages: []
};

// 主动消息按 id 去重：状态每次广播都会带上最近几条，窗口只显示没见过的。
// 首次拿到状态时把已有消息的 id 当基线，重开窗口不重放旧消息。
let lastNoticeId = 0;
let noticeBaselineSet = false;

function sessionLabel(n) {
  // 会话标题来自 Claude Code 自己生成的会话名，最好认。
  if (n.title) return n.title;
  const parts = String(n.cwd || '').split(/[\\/]/).filter(Boolean);
  const dir = parts[parts.length - 1];
  // 拿不到标题时退回目录名 + 一小段会话 id：同一仓库里的多个会话才分得开。
  const short = String(n.session || '').slice(0, 8);
  return dir ? `${dir} · ${short}` : short;
}

if (window.petAPI.initialState === 'working') {
  view.detail = { state: 'working', tool: 'Read', reads: 12, consecutiveLimit: 25 };
} else if (window.petAPI.initialState === 'alert') {
  view.detail = { state: 'alert', reads: 25 };
  view.alerts = 1;
}

// 会话消息只活在这个窗口的内存里；上限只为不让它无限长。
const MAX_MESSAGES = 500;

function pushMessage(m) {
  view.messages.push(m);
  if (view.messages.length > MAX_MESSAGES) view.messages.splice(0, view.messages.length - MAX_MESSAGES);
}

function statusText(v) {
  const d = v.detail;
  if (!d || !d.state) return '';
  const others = Math.max(0, (v.sessions || 0) - 1);
  if (d.state === 'alert') {
    const parts = [`连续 ${d.reads} 次读未写`];
    if (v.alerts > 1) parts.push(`另 ${v.alerts - 1} 个预警`);
    if (others > 0) parts.push(`共 ${v.sessions} 会话`);
    return parts.join(' · ');
  }
  if (d.state === 'working') {
    // 阈值由主进程的聚合结果带过来；窗口不再自带默认值。
    const cap = d.consecutiveLimit;
    const head = d.tool ? `${d.tool} · ${d.reads}/${cap}` : `${d.reads}/${cap}`;
    return others > 0 ? `${head} · ${v.sessions} 会话` : head;
  }
  return '';
}

function clockOf(ts) {
  const d = new Date(ts || Date.now());
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderMessages() {
  // 只有本来就在底部时才跟着滚到底；正在往上翻旧消息时，新消息不该把人拽走。
  const atBottom = chatList.scrollHeight - chatList.clientHeight - chatList.scrollTop < 4;
  chatEmpty.classList.toggle('hidden', view.messages.length > 0);
  chatList.replaceChildren(
    ...view.messages.map((m) => {
      const row = document.createElement('div');
      row.className = `chat-msg ${m.from === 'user' ? 'from-user' : 'from-pet'}`;
      const role = document.createElement('span');
      role.className = 'chat-role';
      role.textContent = `${m.from === 'user' ? '你' : '桌宠'} · ${clockOf(m.ts)}`;
      row.append(role, document.createTextNode(m.text));
      return row;
    }),
    chatEmpty
  );
  if (atBottom) chatList.scrollTop = chatList.scrollHeight;
}

function render() {
  pet.dataset.state = view.state;
  petImg.src = ASSETS[view.state] || '../assets/unknown.svg';
  chatAvatar.src = ASSETS[view.state] || '../assets/unknown.svg';

  const text = statusText(view);
  if (view.chatOpen) {
    // 卡片页眉已经显示状态，气泡让位。
    bubble.classList.add('hidden');
    chat.classList.remove('hidden');
  } else {
    chat.classList.add('hidden');
    if (text) {
      bubbleText.textContent = text;
      bubble.classList.remove('hidden');
    } else {
      bubble.classList.add('hidden');
    }
  }
  chatStatus.textContent = text;
  chatOpenBtn.classList.toggle('hidden', view.chatOpen);
}

function applyNotices(list) {
  if (!Array.isArray(list)) return;
  if (!noticeBaselineSet) {
    noticeBaselineSet = true;
    lastNoticeId = list.reduce((max, n) => Math.max(max, n.id || 0), 0);
    return;
  }
  const fresh = list.filter((n) => n.id > lastNoticeId);
  if (fresh.length === 0) return;
  lastNoticeId = fresh.reduce((max, n) => Math.max(max, n.id), lastNoticeId);
  for (const n of fresh) {
    // 哪个会话做完，比做了什么更要紧；细节等接入 agent 总结。
    pushMessage({ from: 'pet', text: `这一轮结束了 · ${sessionLabel(n)}`, ts: n.ts });
  }
  renderMessages();
  // 收起时只在入口上留一个未读点，不弹别的。
  if (!view.chatOpen) chatOpenBtn.classList.add('unread');
}

function setChat(open) {
  if (view.chatOpen === open) return;
  view.chatOpen = open;
  // 打开就算读过。
  if (open) chatOpenBtn.classList.remove('unread');
  document.body.classList.toggle('chat', open);
  render();
  // 主进程按宠物锚点缩放窗口；聚焦由它负责。
  window.petAPI.setChat(open);
  if (open) {
    chatInput.focus();
    // 打开时直接看最新的；滚动要在卡片显示出来之后做，隐藏时量不到高度。
    chatList.scrollTop = chatList.scrollHeight;
  }
}

// 清空只清窗口里这份：lastNoticeId 不动，服务端队列里的旧消息不会回填。
function clearChat() {
  view.messages = [];
  chatOpenBtn.classList.remove('unread');
  renderMessages();
}

chatOpenBtn.addEventListener('click', () => setChat(true));
chatCollapseBtn.addEventListener('click', () => setChat(false));
chatClearBtn.addEventListener('click', clearChat);
// 气泡本身也能点开对话，不用非得瞄准小按钮。
bubble.addEventListener('click', () => setChat(true));

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  pushMessage({ from: 'user', text, ts: Date.now() });
  chatInput.value = '';
  renderMessages();
  // 会话接入前的占位：没有回复时不假装有。
});

function applyState(payload) {
  if (!payload || !payload.main) return;
  if (window.petAPI.initialState) return; // 截图模式：固定在 --state 指定的画面上
  view.state = payload.main.state || 'idle';
  view.detail = payload.main;
  view.sessions = payload.sessions || 0;
  view.alerts = payload.alerts || 0;
  render();
  applyNotices(payload.notices);
}

// Esc：展开时收起到宠物，收起时退出。右键菜单仍是「重启 / 退出」。
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (view.chatOpen) setChat(false);
  else window.petAPI.quit();
});

window.petAPI.onState(applyState);
window.petAPI.onChat((open) => setChat(open));
window.petAPI.requestState();
document.body.classList.toggle('chat', view.chatOpen);
render();
renderMessages();
