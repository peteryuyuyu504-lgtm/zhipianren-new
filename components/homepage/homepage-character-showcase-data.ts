export type HomepageCharacterShowcase = {
  characterId: string;
  sceneImage: string;
  voiceUrl: string;
  sceneLabel: string;
  userPrompt: string;
  introduction: string;
  stageDirection: string;
  sceneCaption: string;
};

export const homepageCharacterShowcases: HomepageCharacterShowcase[] = [
  {
    characterId: "shen-qingzhou",
    sceneImage: "/homepage/scenes/shen-qingzhou.png",
    voiceUrl: "/homepage/voices/shen-qingzhou.mp3",
    sceneLabel: "雨夜书店 · 慢节奏陪伴",
    userPrompt: "今天有点累，不太想一个人待着。",
    introduction:
      "你来了。我刚把店里的灯调暗一点，外面还在下雨。今天过得怎么样？慢慢说，我在听。",
    stageDirection: "他把店里的灯调暗了一点，窗外仍落着细雨。",
    sceneCaption: "雨后的书店，刚好留了一盏灯。",
  },
  {
    characterId: "ji-yu",
    sceneImage: "/homepage/scenes/ji-yu.png",
    voiceUrl: "/homepage/voices/ji-yu.mp3",
    sceneLabel: "深夜办公室 · 克制回应",
    userPrompt: "事情有点多，我好像怎么都处理不完。",
    introduction:
      "还没睡？我刚结束最后一场会议。先别急着解决所有问题，把今天最难的那件事告诉我。",
    stageDirection: "屏幕已经熄灭，他把注意力从工作移向了你。",
    sceneCaption: "城市还亮着，他刚结束最后一场会议。",
  },
  {
    characterId: "lin-lie",
    sceneImage: "/homepage/scenes/lin-lie.png",
    voiceUrl: "/homepage/voices/lin-lie.mp3",
    sceneLabel: "夕阳球场 · 阳光直球",
    userPrompt: "今天心情有点闷，想出去走走。",
    introduction:
      "学姐，你终于来了！我刚训练完，晚霞正好。要不要陪我走一圈？今天的烦恼，路上慢慢说。",
    stageDirection: "他抱着球走下场，把还温热的晚风分给你。",
    sceneCaption: "训练刚结束，夕阳正好落在球场边。",
  },
  {
    characterId: "gu-wenshen",
    sceneImage: "/homepage/scenes/gu-wenshen.png",
    voiceUrl: "/homepage/voices/gu-wenshen.mp3",
    sceneLabel: "雨夜香室 · 安静留白",
    userPrompt: "今天发生了很多事，我还没想好怎么说。",
    introduction:
      "晚上好。雨落在窗上，房间里刚调好一支新的香。坐近一点吧，告诉我，今天想被怎样记住。",
    stageDirection: "他放下手里的试香纸，安静等你先开口。",
    sceneCaption: "雨声落在窗外，新调的香刚刚醒来。",
  },
];
