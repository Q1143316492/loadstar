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
  // 会话尚未接入：先只承载用户发出的消息，回复留给下一步。
  messages: []
};

if (window.petAPI.initialState === 'working') {
  view.detail = { state: 'working', tool: 'Read', reads: 12, consecutiveLimit: 25 };
} else if (window.petAPI.initialState === 'alert') {
  view.detail = { state: 'alert', reads: 25 };
  view.alerts = 1;
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

function renderMessages() {
  chatEmpty.classList.toggle('hidden', view.messages.length > 0);
  chatList.replaceChildren(
    ...view.messages.map((m) => {
      const row = document.createElement('div');
      row.className = `chat-msg ${m.from === 'user' ? 'from-user' : 'from-pet'}`;
      const role = document.createElement('span');
      role.className = 'chat-role';
      role.textContent = m.from === 'user' ? '你' : '桌宠';
      row.append(role, document.createTextNode(m.text));
      return row;
    }),
    chatEmpty
  );
  chatList.scrollTop = chatList.scrollHeight;
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

function setChat(open) {
  if (view.chatOpen === open) return;
  view.chatOpen = open;
  document.body.classList.toggle('chat', open);
  render();
  // 主进程按右下角锚点缩放窗口；聚焦由它负责。
  window.petAPI.setChat(open);
  if (open) chatInput.focus();
}

chatOpenBtn.addEventListener('click', () => setChat(true));
chatCollapseBtn.addEventListener('click', () => setChat(false));
// 气泡本身也能点开对话，不用非得瞄准小按钮。
bubble.addEventListener('click', () => setChat(true));

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  view.messages.push({ from: 'user', text });
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
