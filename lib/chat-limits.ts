const DEFAULT_CHAT_MESSAGE_MAX_LENGTH = 500;

const configuredMessageLimit = Number(
  process.env.NEXT_PUBLIC_CHAT_MESSAGE_MAX_LENGTH,
);

export const CHAT_MESSAGE_MAX_LENGTH =
  Number.isSafeInteger(configuredMessageLimit) && configuredMessageLimit > 0
    ? configuredMessageLimit
    : DEFAULT_CHAT_MESSAGE_MAX_LENGTH;
