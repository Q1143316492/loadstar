// 本机 HTTP 服务：收钩子事件，出状态。127.0.0.1 之外一律不监听。
const http = require('node:http');

const MAX_BODY = 64 * 1024;

function createServer({ state, onUpdate, onQuit }) {
  const server = http.createServer((req, res) => {
    const send = (status, obj) => {
      const body = JSON.stringify(obj);
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
      res.end(body);
    };

    if (req.method === 'GET' && req.url === '/health') {
      return send(200, { ok: true });
    }

    if (req.method === 'GET' && req.url === '/state') {
      return send(200, state.aggregate());
    }

    if (req.method === 'POST' && req.url === '/event') {
      let body = '';
      let overflow = false;
      req.setEncoding('utf8');
      req.on('data', (chunk) => {
        if (overflow) return;
        body += chunk;
        if (body.length > MAX_BODY) {
          overflow = true;
          req.destroy();
        }
      });
      req.on('end', () => {
        if (overflow) return;
        let payload;
        try {
          payload = JSON.parse(body);
        } catch {
          return send(400, { error: 'invalid json' });
        }
        const { reply } = state.handleEvent(payload);
        if (onUpdate) onUpdate();
        // 空回复也必须返回合法 JSON：钩子会原样透传 stdout。
        return send(200, reply || {});
      });
      return;
    }

    // 关闭：退出前先行回包，让调用方拿到确认。
    if (req.method === 'POST' && req.url === '/quit') {
      send(200, { ok: true, closing: true });
      setImmediate(() => onQuit && onQuit());
      return;
    }

    send(404, { error: 'not found' });
  });

  return server;
}

module.exports = { createServer };
