// 会话状态机：钩子无状态，判定全在这里。纯逻辑，不碰 HTTP 与 UI。
const { classify } = require('./classify');

const ALERT_NONE = 0;
const ALERT_CONSECUTIVE = 1;
const ALERT_TIME_WINDOW = 2;

function createSession(id, now) {
  return {
    id,
    cwd: '',
    state: 'idle',
    consecutiveReads: 0,
    callsSinceAnchor: 0,
    anchorTs: now,
    lastEventTs: now,
    lastToolName: null,
    alertSince: null,
    // 本轮（一次 UserPromptSubmit 到 Stop）调过的工具数：用来判断「这一轮算不算干了活」。
    turnCalls: 0
  };
}

function createState({ getConfig, getRules, logger, now = Date.now }) {
  const sessions = new Map();
  const transitions = []; // 最近的状态迁移，供 /state 观察
  // 主动消息：最近的「任务完成」。多个会话同时收尾时都要到窗口，
  // 所以是一条小队列；窗口按 id 去重。
  let noticeSeq = 0;
  const notices = [];
  const MAX_NOTICES = 20;

  function log(session, kind, extra) {
    if (!logger) return;
    try {
      logger(session.id, { ts: now(), kind, session: session.id, ...extra });
    } catch {
      // 日志失败不打扰判定
    }
  }

  function transition(session, to, reason) {
    if (session.state === to) return null;
    const from = session.state;
    session.state = to;
    session.alertSince = to === 'alert' ? now() : null;
    const record = { from, to, reason, at: now() };
    log(session, 'transition', record);
    transitions.push({ ...record, session: session.id });
    if (transitions.length > 100) transitions.shift();
    return record;
  }

  function alertReason(session) {
    // 阈值由 config.js 解析并填好默认值；这里不再自带回落数字。
    const t = getConfig().thresholds;
    if (session.consecutiveReads >= t.consecutiveReads) return ALERT_CONSECUTIVE;
    if (now() - session.anchorTs >= t.idleMinutes * 60000 && session.callsSinceAnchor >= t.minCallsInWindow) {
      return ALERT_TIME_WINDOW;
    }
    return ALERT_NONE;
  }

  function nudgeReply(session, reason) {
    const cfg = getConfig();
    const text = cfg.nudge.text.replace('{reads}', String(session.consecutiveReads));
    const sysTpl = cfg.nudge.systemMessage;
    const reply = {};

    if (cfg.toggles.agentNudge && text) {
      reply.hookSpecificOutput = { hookEventName: 'PostToolUse', additionalContext: text };
    }
    if (cfg.toggles.systemMessage && sysTpl) {
      reply.systemMessage = sysTpl.replace('{reads}', String(session.consecutiveReads));
    }
    return Object.keys(reply).length > 0 ? reply : null;
  }

  function noteWrite(session) {
    session.consecutiveReads = 0;
    session.callsSinceAnchor = 0;
    session.anchorTs = now();
  }

  function handleToolEvent(session, payload) {
    const rules = getRules();
    const cls = classify(rules, payload.tool_name, payload.tool_input);
    session.lastToolName = payload.tool_name || null;
    session.lastEventTs = now();
    session.turnCalls += 1;

    if (cls === 'write') {
      noteWrite(session);
      transition(session, 'working', 'write');
      return { cls };
    }

    if (cls === 'read') {
      session.consecutiveReads += 1;
      session.callsSinceAnchor += 1;
      if (session.state === 'idle') transition(session, 'working', 'tool');
      if (session.state !== 'alert') {
        const reason = alertReason(session);
        if (reason !== ALERT_NONE) {
          transition(session, 'alert', reason === ALERT_CONSECUTIVE ? 'consecutive-reads' : 'time-window');
          return { cls, alert: reason };
        }
      }
      return { cls };
    }

    // 中性：不增不清；会话层面表示「在动」。
    if (session.state === 'idle') transition(session, 'working', 'tool');
    return { cls };
  }

  function handleEvent(payload) {
    if (!payload || typeof payload.session_id !== 'string' || !payload.session_id) {
      return { reply: null, ignored: true };
    }

    const event = payload.event || 'Unknown';
    let session = sessions.get(payload.session_id);
    if (!session) {
      session = createSession(payload.session_id, now());
      sessions.set(payload.session_id, session);
      log(session, 'transition', { from: null, to: 'idle', reason: 'session-created', at: now() });
    }
    if (payload.cwd) session.cwd = payload.cwd;
    // 会话标题由钩子在 Stop 时从 transcript 里读出来；比目录名好认。
    if (payload.session_title) session.title = payload.session_title;

    let reply = null;
    switch (event) {
      case 'SessionStart':
        session.anchorTs = now();
        session.lastEventTs = now();
        session.turnCalls = 0;
        transition(session, 'working', 'session-start');
        break;
      case 'PostToolUse': {
        const result = handleToolEvent(session, payload);
        log(session, 'event', { event, tool: payload.tool_name || null, cls: result.cls });
        if (result.alert) reply = nudgeReply(session, result.alert);
        break;
      }
      case 'UserPromptSubmit':
        session.lastEventTs = now();
        session.turnCalls = 0;
        log(session, 'event', { event });
        if (session.state === 'alert') transition(session, 'working', 'user-prompt');
        break;
      case 'Stop': {
        session.lastEventTs = now();
        log(session, 'event', { event });
        // stop_hook_active：别的钩子让模型继续了，这一轮没真结束。
        // turnCalls 为 0 的是纯聊天回合，不算任务完成。
        if (!payload.stop_hook_active && session.turnCalls > 0) {
          notices.push({
            id: ++noticeSeq,
            kind: 'turn-end',
            session: session.id,
            title: session.title || null,
            cwd: session.cwd,
            ts: now()
          });
          if (notices.length > MAX_NOTICES) notices.shift();
        }
        session.turnCalls = 0;
        break;
      }
      case 'SessionEnd': {
        log(session, 'event', { event });
        log(session, 'transition', { from: session.state, to: 'destroyed', reason: 'session-end', at: now() });
        sessions.delete(session.id);
        break;
      }
      default:
        session.lastEventTs = now();
        log(session, 'event', { event });
    }

    return { reply };
  }

  // 展示用的空闲降级：久无事件的会话显示为空闲；SessionEnd 才是销毁。
  function tick() {
    const idleMs = getConfig().thresholds.sessionIdleMinutes * 60000;
    let changed = false;
    for (const session of sessions.values()) {
      if (session.state === 'working' && now() - session.lastEventTs >= idleMs) {
        transition(session, 'idle', 'idle-timeout');
        changed = true;
      }
    }
    return changed;
  }

  function aggregate() {
    const all = [...sessions.values()];
    const alerts = all.filter((s) => s.state === 'alert');
    alerts.sort((a, b) => (a.alertSince || 0) - (b.alertSince || 0));
    const working = all.filter((s) => s.state === 'working');
    working.sort((a, b) => b.lastEventTs - a.lastEventTs);

    const mainSession = alerts[0] || working[0] || null;
    const cfg = getConfig();
    const visible = cfg.toggles.pet ? mainSession : null;

    return {
      main: visible
        ? {
            session: visible.id,
            state: visible.state,
            tool: visible.lastToolName,
            reads: visible.consecutiveReads,
            consecutiveLimit: cfg.thresholds.consecutiveReads
          }
        : { state: 'idle' },
      sessions: all.length,
      alerts: alerts.length,
      // 最近的「任务完成」；窗口按 id 去重，首次连接只记基线不重放。
      notices: notices.slice(),
      detail: all.map((s) => ({
        session: s.id,
        title: s.title || null,
        state: s.state,
        reads: s.consecutiveReads,
        tool: s.lastToolName,
        cwd: s.cwd,
        lastEventTs: s.lastEventTs
      }))
    };
  }

  return { handleEvent, tick, aggregate, sessions };
}

module.exports = { createState };
