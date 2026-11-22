// 把一份判读 JSON 灌进 TEMPLATE.html，产出可直接打开的一页。
//
// 用法：node render.js <判读.json> [地图目录]
//   地图目录给了，就顺手拿票的 `状态：` / `阻塞于：` 行对一遍，不一致直接报错。
//   通过：打印输出文件的绝对路径，退出码 0。
//   不通过：逐条打印 ERR / WARN，退出码 1。

const fs = require('fs');
const os = require('os');
const path = require('path');

const [dataPath, mapDir] = process.argv.slice(2);
if (!dataPath) {
  console.error('用法: node render.js <判读.json> [地图目录]');
  process.exit(1);
}

const TYPES = ['grilling', 'research', 'task', 'prototype'];
const STATUSES = ['待办', '已认领', '已解决', '已关闭'];
const LIMIT = { short: 6.5, gist: 24, point: 23, brief: 100, why: 45 };

const errors = [];
const warns = [];
const err = (m) => errors.push('ERR  ' + m);
const warn = (m) => warns.push('WARN ' + m);

// 显示宽度：中日韩全角算 1，其余算 0.5。版面按这个排，不是按字符数。
function width(s) {
  return [...String(s)].reduce((a, c) => a + (/[⺀-鿿＀-￯　-〿]/.test(c) ? 1 : 0.5), 0);
}
function checkWidth(where, s, max) {
  if (typeof s !== 'string' || !s.trim()) { err(where + ' 缺失'); return; }
  const w = width(s);
  if (w > max) err(where + ' 宽 ' + w.toFixed(1) + '，上限 ' + max + ' —— ' + s);
}

let MAP;
try {
  MAP = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (e) {
  console.error('ERR  判读 JSON 读不了：' + e.message);
  process.exit(1);
}

// ── 结构 ────────────────────────────────────────────────
['name', 'slug', 'updated'].forEach(k => {
  if (typeof MAP[k] !== 'string' || !MAP[k].trim()) err(k + ' 缺失');
});
checkWidth('brief', MAP.brief, LIMIT.brief);
if (!MAP.now || !MAP.now.id) err('now.id 缺失');
else checkWidth('now.why', MAP.now.why, LIMIT.why);

if (!Array.isArray(MAP.tickets) || !MAP.tickets.length) {
  err('tickets 为空');
}

const byId = {};
(MAP.tickets || []).forEach((t, i) => {
  const at = 'tickets[' + i + ']' + (t && t.id ? '(' + t.id + ')' : '');
  if (!t || typeof t !== 'object') { err(at + ' 不是对象'); return; }
  if (!/^\d{2}$/.test(t.id || '')) err(at + ' id 要是两位数字');
  if (byId[t.id]) err(at + ' id 重复');
  byId[t.id] = t;

  checkWidth(at + '.short', t.short, LIMIT.short);
  checkWidth(at + '.gist', t.gist, LIMIT.gist);

  if (TYPES.indexOf(t.type) === -1) err(at + '.type 只能是 ' + TYPES.join(' / '));
  if (STATUSES.indexOf(t.status) === -1) err(at + '.status 只能是 ' + STATUSES.join(' / '));
  if (t.status === '已关闭') warn(at + ' 已关闭，路线视图里应排除（它属于「超出范围」）');

  if (typeof t.file !== 'string' || !/^tickets\/.+\.md$/.test(t.file)) {
    err(at + '.file 要写成 tickets/NN-slug.md');
  }

  if (!Array.isArray(t.points) || t.points.length < 3 || t.points.length > 4) {
    err(at + '.points 要 3–4 条');
  } else {
    t.points.forEach((p, j) => checkWidth(at + '.points[' + j + ']', p, LIMIT.point));
    if (new Set(t.points).size !== t.points.length) warn(at + '.points 有重复条目');
  }
});

(MAP.tickets || []).forEach(t => {
  if (!Array.isArray(t.blockedBy)) { err('tickets(' + t.id + ').blockedBy 要是数组（没有就写 []）'); return; }
  t.blockedBy.forEach(dep => {
    if (!byId[dep]) err('tickets(' + t.id + ') 阻塞于 ' + dep + '，但 data 里没有这张票');
  });
});

// 环检测：依赖图必须是 DAG，否则波次算不出来
(function detectCycle() {
  const seen = {}, stack = {};
  const walk = (id) => {
    if (stack[id]) { err('依赖成环，经过 ' + id); return; }
    if (seen[id]) return;
    stack[id] = true;
    (byId[id] ? byId[id].blockedBy : []).forEach(d => byId[d] && walk(d));
    stack[id] = false; seen[id] = true;
  };
  Object.keys(byId).forEach(walk);
})();

// ── 「现在」这一张 ──────────────────────────────────────
const isResolved = (id) => byId[id] && byId[id].status === '已解决';
const stateOf = (t) => t.status === '已解决' ? 'resolved'
  : t.status === '已认领' ? 'claimed'
  : t.blockedBy.every(isResolved) ? 'ready' : 'blocked';

if (MAP.now && MAP.now.id) {
  const nowT = byId[MAP.now.id];
  if (!nowT) err('now.id ' + MAP.now.id + ' 不在 tickets 里');
  else {
    const s = stateOf(nowT);
    if (s !== 'ready' && s !== 'claimed') {
      err('now.id ' + MAP.now.id + ' 现在是「' + s + '」，只有在「可开工」或「已认领」的票才配当「现在」');
    }
  }
}

// ── 与票文件对账 ────────────────────────────────────────
if (mapDir) {
  const ticketsDir = path.join(mapDir, 'tickets');
  if (!fs.existsSync(path.join(mapDir, 'map.md'))) err('地图目录里没有 map.md：' + mapDir);
  if (!fs.existsSync(ticketsDir)) err('地图目录里没有 tickets/：' + mapDir);

  (MAP.tickets || []).forEach(t => {
    if (typeof t.file !== 'string') return;
    const p = path.join(mapDir, t.file);
    if (!fs.existsSync(p)) { err(t.id + ' 的 ' + t.file + ' 不存在'); return; }
    const src = fs.readFileSync(p, 'utf8');

    const st = src.match(/^状态：\s*(\S+)/m);
    if (!st) warn(t.id + ' 的票里找不到「状态：」行，没法对账');
    else if (st[1] !== t.status) err(t.id + ' 状态写成「' + t.status + '」，票里是「' + st[1] + '」');

    const ty = src.match(/^类型：\s*(\S+)/m);
    if (ty && ty[1] !== t.type) err(t.id + ' 类型写成「' + t.type + '」，票里是「' + ty[1] + '」');

    const dep = src.match(/^阻塞于：\s*(.*)$/m);
    if (dep) {
      const raw = dep[1].trim();
      const want = raw === '无' || raw === ''
        ? []
        : (raw.match(/\d+/g) || []).map(n => n.padStart(2, '0'));
      const have = (t.blockedBy || []).slice().sort();
      if (want.slice().sort().join(',') !== have.join(',')) {
        err(t.id + ' 阻塞于写成 [' + have.join(', ') + ']，票里是 [' + want.join(', ') + ']');
      }
    } else {
      warn(t.id + ' 的票里找不到「阻塞于：」行');
    }
  });

  // 反向：tickets/ 里有、data 里没有
  if (fs.existsSync(ticketsDir)) {
    fs.readdirSync(ticketsDir).filter(f => f.endsWith('.md')).forEach(f => {
      if (!(MAP.tickets || []).some(t => t.file === 'tickets/' + f)) {
        warn('票 ' + f + ' 没有进判读（已关闭的票本就该排除；其余说明漏了）');
      }
    });
  }
}

// ── 灌进壳 ──────────────────────────────────────────────
const BEGIN = '/* ==== MAP_DATA_BEGIN ==== */';
const END = '/* ==== MAP_DATA_END ==== */';
const shell = fs.readFileSync(path.join(__dirname, 'TEMPLATE.html'), 'utf8');
const b = shell.indexOf(BEGIN);
const e = shell.indexOf(END);
if (b < 0 || e < 0 || e < b) {
  console.error('ERR  TEMPLATE.html 里的哨兵注释不见了，没法定位数据块');
  process.exit(1);
}

if (warns.length) warns.forEach(w => console.log(w));
if (errors.length) {
  errors.forEach(x => console.log(x));
  console.log('\n共 ' + errors.length + ' 条错误，未产出页面。');
  process.exit(1);
}

const block = '\nconst MAP = ' + JSON.stringify(MAP, null, 2) + ';\n';
const html = shell.slice(0, b + BEGIN.length) + block + shell.slice(e);

const outDir = path.join(os.tmpdir(), 'map-view');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'map-' + MAP.slug + '.html');
fs.writeFileSync(outFile, html, 'utf8');

console.log(outFile);
