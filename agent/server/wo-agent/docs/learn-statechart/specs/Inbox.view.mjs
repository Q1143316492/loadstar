// Inbox 的 statechart view：把 63 个模型状态压成读者关心的形状。
//
// 读者只关心「还有多少东西在等我处理」，不关心内部编号。
// 注意：TLA+ 的序列在这里投影成对象（键是 "1","2",…），集合投影成数组。

const len = (seq) => (seq && typeof seq === "object" ? Object.keys(seq).length : 0);

const shape = (vars) => {
  const turn = len(vars.nextTurn);
  const step = len(vars.nextStep);
  if (turn === 0 && step === 0) return "空闲，没有待处理的消息";
  const parts = [];
  if (turn > 0) parts.push(`下一轮排队 ${turn} 条`);
  if (step > 0) parts.push(`下一步排队 ${step} 条`);
  return parts.join("，");
};

export const state = (vars) => shape(vars);

export const group = (vars) =>
  len(vars.nextTurn) === 0 && len(vars.nextStep) === 0 ? "空闲" : "有排队";

export const colors = {
  空闲: "tan",
  有排队: "blue",
};

export const title = "Inbox 消息在两级队列之间怎么流动";

export const step = (action) => {
  switch (action) {
    case "PushTurn":
      return "推进一条「下一轮再说」";
    case "PushStep":
      return "推进一条「现在就用」";
    case "ClaimStep":
      return "取走全部现用的";
    case "ClaimTurn":
      return "取走队首的那一轮";
    default:
      return action;
  }
};
