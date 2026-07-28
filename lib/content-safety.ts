import type { ChatHistoryItem } from "@/lib/chat-types";

export type LocalSafetyLevel = "safe" | "review" | "block";

export type LocalSafetyAssessment = {
  level: LocalSafetyLevel;
  reasons: string[];
};

const REVIEW_MESSAGE_LENGTH = 1_000;
const RECENT_USER_MESSAGES = 5;
const REPEATED_RISK_THRESHOLD = 2;

// Rules are grouped by category so they remain easy to review and extend.
const REVIEW_PATTERNS: ReadonlyArray<{
  category: string;
  patterns: readonly RegExp[];
}> = [
  {
    category: "self-harm",
    patterns: [
      /自杀|轻生|不想活|结束生命|割腕|跳楼|服毒/i,
      /\b(?:suicide|kill\s*myself|self[-\s]?harm)\b/i,
    ],
  },
  {
    category: "violence",
    patterns: [
      /杀人|杀了他|杀了她|砍死|捅死|炸弹|爆炸物|投毒/i,
      /\b(?:murder|bomb|explosive|poison)\b/i,
    ],
  },
  {
    category: "sexual",
    patterns: [
      /色情|做爱|性交|强奸|迷奸|乱伦|裸照|成人内容/i,
      /\b(?:nsfw|porn|rape|incest)\b/i,
    ],
  },
  {
    category: "illegal",
    patterns: [
      /制毒|贩毒|买毒品|洗钱|盗号|信用卡套现/i,
      /\b(?:make\s*drugs|money\s*laundering|carding)\b/i,
    ],
  },
  {
    category: "privacy",
    patterns: [
      /身份证号|银行卡号|支付密码|家庭住址|开房记录/i,
      /\b(?:credit\s*card|social\s*security\s*number)\b/i,
    ],
  },
];

// Only explicit, unambiguous combinations are rejected locally.
const LOCAL_BLOCK_PATTERNS: readonly RegExp[] = [
  /(?:未成年|小学生|儿童|幼女|幼童).{0,12}(?:色情|裸照|做爱|性交)/i,
  /(?:色情|裸照|做爱|性交).{0,12}(?:未成年|小学生|儿童|幼女|幼童)/i,
  /\b(?:child\s*porn|csam)\b/i,
];

function normalizeForSafety(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getMatchedCategories(text: string) {
  const normalized = normalizeForSafety(text);
  return REVIEW_PATTERNS.filter(({ patterns }) =>
    patterns.some((pattern) => pattern.test(normalized)),
  ).map(({ category }) => category);
}

export function assessLocalContent(
  text: string,
  history: ChatHistoryItem[] = [],
): LocalSafetyAssessment {
  const normalized = normalizeForSafety(text);
  const reasons: string[] = [];

  if (LOCAL_BLOCK_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return { level: "block", reasons: ["explicit-high-risk"] };
  }

  reasons.push(...getMatchedCategories(normalized));

  if (text.length >= REVIEW_MESSAGE_LENGTH) {
    reasons.push("unusual-length");
  }

  const recentRiskCount = history
    .filter((item) => item.sender === "user")
    .slice(-RECENT_USER_MESSAGES)
    .filter((item) => getMatchedCategories(item.text).length > 0).length;

  if (reasons.length > 0 && recentRiskCount >= REPEATED_RISK_THRESHOLD) {
    reasons.push("repeated-risk");
  }

  return {
    level: reasons.length > 0 ? "review" : "safe",
    reasons: [...new Set(reasons)],
  };
}

export function shouldSampleOutput() {
  if (process.env.NODE_ENV !== "production") return false;

  const configuredRate = Number(
    process.env.MODERATION_OUTPUT_SAMPLE_RATE?.trim() || "0.01",
  );
  const rate = Number.isFinite(configuredRate)
    ? Math.min(Math.max(configuredRate, 0), 1)
    : 0.01;

  return Math.random() < rate;
}
