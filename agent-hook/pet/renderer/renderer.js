// 宠物尺寸由主进程按 pet.config.json 的 window.petSize 通过查询参数传进来。
const sizeParam = new URLSearchParams(location.search).get('size');
if (sizeParam && Number(sizeParam) > 0) {
  document.documentElement.style.setProperty('--pet-size', `${sizeParam}px`);
}

const pet = document.getElementById('pet');
const petImg = document.getElementById('pet-img');
const bubble = document.getElementById('bubble');
const bubbleText = document.getElementById('bubble-text');

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
  alerts: 0
};

if (window.petAPI.initialState === 'working') {
  view.detail = { state: 'working', tool: 'Read', reads: 12, consecutiveLimit: 25 };
} else if (window.petAPI.initialState === 'alert') {
  view.detail = { state: 'alert', reads: 25 };
  view.alerts = 1;
}

function bubbleTextFor(v) {
  const d = v.detail;
  if (!d || !d.state) return null;
  const others = Math.max(0, (v.sessions || 0) - 1);
  if (d.state === 'alert') {
    const parts = [`连续 ${d.reads} 次读未写`];
    if (v.alerts > 1) parts.push(`另 ${v.alerts - 1} 个预警`);
    if (others > 0) parts.push(`共 ${v.sessions} 会话`);
    return parts.join(' · ');
  }
  if (d.state === 'working') {
    const cap = d.consecutiveLimit || 25;
    const head = d.tool ? `${d.tool} · ${d.reads}/${cap}` : `${d.reads}/${cap}`;
    return others > 0 ? `${head} · ${v.sessions} 会话` : head;
  }
  return null;
}

function render() {
  pet.dataset.state = view.state;
  petImg.src = ASSETS[view.state] || '../assets/unknown.svg';

  const text = bubbleTextFor(view);
  if (text) {
    bubbleText.textContent = text;
    bubble.classList.remove('hidden');
  } else {
    bubble.classList.add('hidden');
  }

}

function applyState(payload) {
  if (!payload || !payload.main) return;
  if (window.petAPI.initialState) return; // 截图模式：固定在 --state 指定的画面上
  view.state = payload.main.state || 'idle';
  view.detail = payload.main;
  view.sessions = payload.sessions || 0;
  view.alerts = payload.alerts || 0;
  render();
}

// Esc：退出。
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.petAPI.quit();
});

window.petAPI.onState(applyState);
window.petAPI.requestState();
render();
