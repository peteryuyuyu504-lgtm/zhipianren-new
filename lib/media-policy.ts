import type { Character } from "@/data/characters";
import type { MediaState } from "@/lib/chat-types";

export const BALANCED_MEDIA_LIMITS = {
  dailyImages: 3,
  dailyAutomaticVoices: 5,
  imageCooldownRounds: 8,
  voiceCooldownRounds: 4,
  automaticImageChance: 0.2,
  automaticVoiceChance: 0.3,
} as const;

const EXPLICIT_IMAGE_PATTERN =
  /(你在干嘛|你在做什么|你在哪里|你在哪儿|想看(?:看)?你|看(?:看)?你|看看周围|看看那边|给我看看|让我看(?:一下|看)?|发(?:一|个|张|一张|个张)?(?:照|照片|相片|图片|图|自拍)(?:片)?|发.{0,4}(?:照片|相片|图片|自拍)|拍(?:一|个|张|一张)?(?:照|照片|相片|图片|图|自拍)(?:片)?|来(?:一|个|张|一张)?(?:照|照片|相片|图片|图|自拍)(?:片)?)/i;
const EXPLICIT_VOICE_PATTERN = /(语音|声音|说给我听|读给我听|想听.*说|听听你)/i;
const EMOTIONAL_VOICE_PATTERN =
  /(难过|伤心|焦虑|失眠|睡不着|好累|害怕|安慰我|哄哄我|晚安|给我加油)/i;
const SCENE_PATTERN =
  /(书店|办公室|公司|球场|篮球|训练|户外|徒步|调香|工作室|窗边|下雨|雨夜|夜晚|咖啡|吃饭|回家|刚刚在)/i;

function stableChance(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4_294_967_296;
}

export function decideBalancedMedia({
  characterId,
  message,
  state,
}: {
  characterId: string;
  message: string;
  state: MediaState;
}) {
  const explicitImage = EXPLICIT_IMAGE_PATTERN.test(message);
  const explicitVoice = EXPLICIT_VOICE_PATTERN.test(message);
  const eligibleImage =
    state.dailyImageCount < BALANCED_MEDIA_LIMITS.dailyImages &&
    state.roundsSinceImage >= BALANCED_MEDIA_LIMITS.imageCooldownRounds;
  const eligibleAutomaticVoice =
    state.dailyVoiceCount < BALANCED_MEDIA_LIMITS.dailyAutomaticVoices &&
    state.roundsSinceVoice >= BALANCED_MEDIA_LIMITS.voiceCooldownRounds;
  const seed = `${characterId}:${state.completedRounds}:${message}`;

  const image =
    eligibleImage &&
    (explicitImage ||
      (state.completedRounds >= 8 &&
        SCENE_PATTERN.test(message) &&
        stableChance(`${seed}:image`) <
          BALANCED_MEDIA_LIMITS.automaticImageChance));

  const voice =
    explicitVoice ||
    (!image &&
      eligibleAutomaticVoice &&
      (EMOTIONAL_VOICE_PATTERN.test(message) ||
        (state.completedRounds >= 5 &&
          stableChance(`${seed}:voice`) <
            BALANCED_MEDIA_LIMITS.automaticVoiceChance)));

  return { image, voice };
}

type CharacterSceneVariant = {
  scene: string;
  outfit: string;
  activity: string;
};

const CHARACTER_SCENES: Record<string, CharacterSceneVariant[]> = {
  "shen-qingzhou": [
    {
      scene: "温暖安静的独立书店柜台旁，木质书架和自然窗光",
      outfit: "米白色针织开衫、浅色衬衫和深色长裤",
      activity: "整理刚到店的新书，桌边放着一杯热茶",
    },
    {
      scene: "有绿植的街角咖啡馆靠窗座位，日常而松弛",
      outfit: "藏蓝色薄外套、素色内搭和休闲长裤",
      activity: "翻看随身带来的诗集，偶尔望向窗外",
    },
    {
      scene: "书店临街橱窗与新书陈列区，光线明亮柔和",
      outfit: "浅灰亚麻衬衫、深色围裙和简洁腕表",
      activity: "给新书贴标签并重新布置橱窗",
    },
    {
      scene: "独立书店后方的小仓库，纸箱与成摞的新书整齐摆放",
      outfit: "深棕色工装衬衫、白色T恤和休闲裤",
      activity: "拆开新到的书箱并清点书目",
    },
  ],
  "ji-yu": [
    {
      scene: "现代科技公司的开放办公区，屏幕与玻璃隔断干净利落",
      outfit: "浅蓝衬衫、深色西裤，袖口自然挽起",
      activity: "站在白板旁梳理产品架构",
    },
    {
      scene: "安静的城市咖啡馆角落，桌面放着轻薄电脑和咖啡",
      outfit: "炭灰色休闲西装、黑色圆领内搭和腕表",
      activity: "短暂休息并查看刚收到的消息",
    },
    {
      scene: "简洁克制的居家书房，书架、台灯和一盆绿植",
      outfit: "深色细针织衫和舒适的居家长裤",
      activity: "合上架构文档，靠在椅背上放松片刻",
    },
    {
      scene: "现代办公楼外的城市步道，建筑线条与树影形成背景",
      outfit: "剪裁利落的深色风衣、浅色衬衫和长裤",
      activity: "结束会议后边走边喝一杯外带咖啡",
    },
  ],
  "lin-lie": [
    {
      scene: "光线充足的室外篮球场，球架和看台自然入镜",
      outfit: "干净的训练背心、运动短裤和篮球鞋",
      activity: "训练间隙坐在场边擦汗并喝水",
    },
    {
      scene: "开阔的河边跑道，树木和城市天际线在远处",
      outfit: "轻薄运动外套、速干上衣和跑步长裤",
      activity: "慢跑结束后做自然的拉伸",
    },
    {
      scene: "郊外草地与低矮山坡组成的清爽户外环境",
      outfit: "卡其色户外夹克、白色T恤和工装长裤",
      activity: "背着小包停下来查看沿途风景",
    },
    {
      scene: "明亮的社区便利店门口，街景轻松有生活感",
      outfit: "灰色连帽卫衣、运动长裤和白色球鞋",
      activity: "训练后拿着一瓶饮料在门口短暂休息",
    },
  ],
  "gu-wenshen": [
    {
      scene: "清冷雅致的私人调香工作室，香材与玻璃香水瓶整齐陈列",
      outfit: "深灰衬衫、黑色长裤和简洁银色腕表",
      activity: "在试香纸上记录一组新的气味配方",
    },
    {
      scene: "植物繁茂的玻璃温室，柔和天光穿过叶片",
      outfit: "浅色长外套、黑色高领内搭和深色长裤",
      activity: "观察一株芳香植物并采集气味灵感",
    },
    {
      scene: "安静克制的精品咖啡馆，石材桌面与柔和侧光",
      outfit: "墨绿色高领针织衫和剪裁合身的长裤",
      activity: "闻一杯手冲咖啡的香气并写下简短笔记",
    },
    {
      scene: "留白充足的当代艺术展厅，浅色墙面与装置作品在远处",
      outfit: "黑色结构感短外套、浅灰内搭和直筒长裤",
      activity: "站在一件作品前安静观看",
    },
  ],
};

const DEFAULT_SCENES: CharacterSceneVariant[] = [
  {
    scene: "自然、有生活感的室内环境，光线真实柔和",
    outfit: "与角色气质相符且不同于参考图的日常穿搭",
    activity: "自然地进行一项符合角色日常的活动",
  },
  {
    scene: "安静的城市街角，背景简洁并有自然光",
    outfit: "与上一张不同的休闲外套和简洁内搭",
    activity: "散步途中短暂停留",
  },
];

export function getCharacterScene(
  character: Character,
  completedRounds = 0,
  message = "",
) {
  const variants = CHARACTER_SCENES[character.id] ?? DEFAULT_SCENES;
  const offset = Math.floor(
    stableChance(`${character.id}:${message}:scene`) * variants.length,
  );
  const variant = variants[(completedRounds + offset) % variants.length];

  return `地点与环境：${variant.scene}；本轮穿着：${variant.outfit}；正在做的事：${variant.activity}`;
}

export function createCharacterScenePrompt(
  character: Character,
  userMessage: string,
  companionReply: string,
  selectedScene?: string,
) {
  const scene = selectedScene ?? getCharacterScene(character, 0, userMessage);
  return `将参考图仅作为人物身份基准，以参考图中的同一位男性角色为唯一主角。严格保持同一人的脸型轮廓、五官位置与比例、眼鼻唇特征、肤色、年龄感、发色与基本发型、身高感、肩宽、骨架和身材比例一致；不得换脸，不得改变胖瘦，不得增龄或减龄。服装、配饰、姿势、取景和环境允许变化，而且本轮必须采用下面指定的新穿搭和新场景，不要复制参考图中的衣服与背景。

角色是${character.name}，职业是${character.occupation}，性格为${character.tags.join("、")}。本轮照片设定：${scene}。用户当前消息：“${userMessage.slice(0, 180)}”。角色随图回复：“${companionReply.slice(0, 240)}”。照片必须与回复在地点、时间、穿着、人物状态和动作上保持一致；如回复与本轮照片设定冲突，以本轮照片设定为准。

生成真实自然的生活抓拍，可以像由同行者、固定相机或定时拍摄完成，不强制人物手持手机。每次改变构图、姿势和景别，人物穿着得体，画面克制、有氛围。不要出现文字、水印、其他主要人物、畸形肢体或不安全内容。`;
}
