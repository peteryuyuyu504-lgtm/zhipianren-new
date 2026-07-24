import type { Character } from "@/data/characters";
import type { MediaState } from "@/lib/chat-types";

export const BALANCED_MEDIA_LIMITS = {
  dailyImages: 2,
  dailyAutomaticVoices: 5,
  imageCooldownRounds: 8,
  voiceCooldownRounds: 4,
  automaticImageChance: 0.2,
  automaticVoiceChance: 0.3,
} as const;

const EXPLICIT_IMAGE_PATTERN =
  /(你在干嘛|你在做什么|你在哪里|你在哪儿|想看看你|看看你|看看周围|看看那边|发.{0,4}(照片|图片|自拍)|给我看看)/i;
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

const CHARACTER_SCENES: Record<string, string> = {
  "shen-qingzhou":
    "温暖安静的独立书店，木质书架、暖色台灯、诗集与一杯热茶",
  "ji-yu":
    "现代科技公司的深夜办公室，电脑屏幕、冷色灯光与整洁的工作桌",
  "lin-lie":
    "傍晚的篮球场或清爽户外环境，训练后的自然状态，阳光有活力",
  "gu-wenshen":
    "清冷雅致的私人调香工作室，香材、玻璃香水瓶、雪松与雨夜窗景",
};

export function createCharacterScenePrompt(
  character: Character,
  userMessage: string,
) {
  const scene = CHARACTER_SCENES[character.id] ?? "自然、有生活感的室内环境";
  return `以参考图中的同一位男性角色为唯一主角，严格保持他的脸型、五官、发型、年龄感和整体气质一致。角色是${character.name}，职业是${character.occupation}，性格为${character.tags.join("、")}。场景：${scene}。结合当前对话“${userMessage.slice(0, 180)}”，表现他此刻正在做的自然动作。真实生活抓拍感，人物穿着得体，画面克制、有氛围，不出现文字、水印、其他主要人物或不安全内容。`;
}
