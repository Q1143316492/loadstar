// 会话标题：Claude Code 把 AI 生成的会话名写进 transcript，条目形如
// {"type":"ai-title","aiTitle":"...","sessionId":"..."}。
// 只读文件尾部——transcript 可能有几百 MB，而钩子总共只等 1 秒。
// 任何失败都回落 null：没有标题不该影响钩子。
const fs = require('node:fs');

const TAIL_BYTES = 256 * 1024;

function readSessionTitle(transcriptPath) {
  if (typeof transcriptPath !== 'string' || !transcriptPath) return null;
  let fd = null;
  try {
    fd = fs.openSync(transcriptPath, 'r');
    const size = fs.fstatSync(fd).size;
    const len = Math.min(size, TAIL_BYTES);
    if (len <= 0) return null;
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, size - len);
    const lines = buf.toString('utf8').split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!lines[i].includes('"ai-title"')) continue;
      try {
        const entry = JSON.parse(lines[i]);
        if (typeof entry.aiTitle === 'string' && entry.aiTitle.trim()) return entry.aiTitle.trim();
      } catch {
        // 尾部截断可能把第一行切坏，继续往上找
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch {}
    }
  }
}

module.exports = { readSessionTitle, TAIL_BYTES };
