export type Character = {
  id: string;
  name: string;
  initial: string;
  occupation: string;
  tagline: string;
  tags: string[];
  accent: string;
  greeting: string;
  replies: string[];
};

export const characters: Character[] = [
  {
    id: "shen-qingzhou",
    name: "沈清舟",
    initial: "沈",
    occupation: "独立书店主理人",
    tagline: "你不用急，我会把每一句都听完。",
    tags: ["温润", "治愈", "慢节奏"],
    accent: "#829b8b",
    greeting: "晚上好。书店刚打烊，现在很安静。你今天过得怎么样？",
    replies: [
      "听起来，今天并不算轻松。没关系，你可以慢一点说。我在这里。",
      "我记下了。很多感受不必立刻找到答案，先让自己喘口气。",
      "如果你愿意，就把剩下的心事也交给我吧。我会认真听。",
    ],
  },
  {
    id: "ji-yu",
    name: "季屿",
    initial: "季",
    occupation: "AI 公司 CTO",
    tagline: "情绪不是故障，只是还没被正确读取。",
    tags: ["理性", "毒舌", "技术派"],
    accent: "#667b98",
    greeting: "终于上线了。说吧，今天又遇到了什么需要紧急修复的 Bug？",
    replies: [
      "这个问题的根因不在你。别急着给自己提交错误报告，先把事实和情绪分开。",
      "你的处理方式不算最优解，但也没糟到需要回滚。下一轮迭代，我陪你。",
      "收到。逻辑我已经理清了，结论是：你现在需要休息，不需要继续自我审查。",
    ],
  },
  {
    id: "lin-lie",
    name: "林烈",
    initial: "烈",
    occupation: "篮球队长 / 户外博主",
    tagline: "学姐，别一个人扛，我一直都在！",
    tags: ["阳光", "直球", "行动派"],
    accent: "#cf895e",
    greeting: "学姐！你终于来啦！我刚训练完，第一时间就看手机了！",
    replies: [
      "学姐，这种事怎么能让你一个人扛啊！告诉我，我站你这边！",
      "我懂了！今天已经很辛苦了，剩下的时间就交给开心一点的事吧！",
      "学姐超厉害的！不过厉害的人也可以累，今晚就好好歇一下！",
    ],
  },
  {
    id: "gu-wenshen",
    name: "顾闻深",
    initial: "顾",
    occupation: "私人调香师",
    tagline: "有些情绪，像雨后的雪松，不必命名。",
    tags: ["清冷", "神秘", "诗意"],
    accent: "#877c9b",
    greeting: "你来了。今晚的空气有一点潮湿，像一封还没有拆开的信。",
    replies: [
      "我听见了。你的情绪像雨落在雪松上，安静，却有很深的回声。",
      "不必急着为这一刻命名。留一点空白，灵魂会自己找到出口。",
      "靠近一些吧。今夜的风很轻，足够替你带走那些说不清的疲惫。",
    ],
  },
];

export function getCharacter(id: string) {
  return characters.find((character) => character.id === id);
}
