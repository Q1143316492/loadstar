// 钩子脚本读桌宠端口的唯一入口。
// 端口与桌宠共用 pet.config.json；读不到配置时回落默认端口并吞掉一切错误——
// 钩子无论发生什么都必须 exit 0，桌宠没开时要像不存在一样。
const path = require('node:path');

const CONFIG_PATH = path.join(__dirname, '..', 'client', 'pet', 'pet.config.json');
const LAST_RESORT_PORT = 47900;

function petPort() {
  try {
    const { readPort } = require('../client/pet/config');
    return readPort(CONFIG_PATH);
  } catch {
    return LAST_RESORT_PORT;
  }
}

module.exports = { petPort };
