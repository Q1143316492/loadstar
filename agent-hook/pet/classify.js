// 工具三分类：读 / 写 / 中性。规则数据驱动，见 tool-rules.json。
const fs = require('node:fs');

function loadRules(path) {
  const rules = JSON.parse(fs.readFileSync(path, 'utf8'));
  return {
    readTools: new Set(rules.readTools || []),
    writeTools: new Set(rules.writeTools || []),
    bashWrite: (rules.bash?.write || []).map((p) => new RegExp(p)),
    bashRead: (rules.bash?.read || []).map((p) => new RegExp(p))
  };
}

function classify(rules, toolName, toolInput) {
  if (!toolName) return 'neutral';
  if (rules.writeTools.has(toolName)) return 'write';
  if (rules.readTools.has(toolName)) return 'read';
  if (toolName === 'Bash') {
    const command = typeof toolInput?.command === 'string' ? toolInput.command : '';
    // 写优先：宁可漏算，不可多算读。
    if (rules.bashWrite.some((re) => re.test(command))) return 'write';
    if (rules.bashRead.some((re) => re.test(command))) return 'read';
  }
  return 'neutral';
}

module.exports = { loadRules, classify };
