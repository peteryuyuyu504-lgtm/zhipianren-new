const STAGE_DIRECTION_PATTERN =
  /(轻笑|低笑|笑声|笑着|叹气|叹息|气息|吸气|呼气|停顿|沉默|压低声音|小声|温柔地|轻声|哽咽|抽泣|哭腔|清嗓|咳嗽)/;

function createPerformanceInstruction(directions: string[]) {
  const instructions: string[] = [];
  const combined = directions.join("、");

  if (
    /(轻笑|低笑|笑声|笑着)/.test(combined) &&
    /(气息|吸气|呼气)/.test(combined)
  ) {
    instructions.push(
      "带着释然、放松的轻笑与自然呼吸感，先轻轻笑一下再开口",
    );
  } else if (/(轻笑|低笑|笑声|笑着)/.test(combined)) {
    instructions.push("带着自然、放松的轻笑感说话，不要念出动作名称");
  }
  if (/(叹气|叹息)/.test(combined)) {
    instructions.push("先自然地轻叹一口气，再接着说话");
  }
  if (/(哽咽|抽泣|哭腔)/.test(combined)) {
    instructions.push("声音稍有哽咽和克制的哭腔，但保持台词清晰");
  }
  if (/(压低声音|小声|轻声)/.test(combined)) {
    instructions.push("降低音量，轻声、贴近地表达");
  }
  if (/(停顿|沉默)/.test(combined)) {
    instructions.push("开口前自然停顿片刻");
  }
  if (/(清嗓|咳嗽)/.test(combined)) {
    instructions.push("开口前有非常轻微、自然的清嗓感");
  }

  return instructions.length
    ? `${instructions.join("；")}。整体像真实聊天，保留自然气口，不要朗读任何括号、动作或音效说明。`
    : "";
}

export function prepareTextForSpeech(text: string) {
  const directions: string[] = [];
  const speechText = text
    .replace(/[（(]([^（）()\n]{1,30})[）)]/g, (match, direction: string) => {
      if (!STAGE_DIRECTION_PATTERN.test(direction)) return match;
      directions.push(direction);
      return "";
    })
    .replace(/^[，、；：]\s*/u, "")
    .replace(/([，。！？；：])(?:\s*\1)+/gu, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return {
    text: speechText,
    performanceInstruction: createPerformanceInstruction(directions),
  };
}
