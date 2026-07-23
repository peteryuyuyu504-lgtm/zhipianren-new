const MOCK_AUTH_KEY = "paper-boyfriend:mock-auth";

type MockAuthState = {
  loggedIn: true;
  version: 1;
};

// Mock 登录仅保存开发阶段的布尔状态，不保存邮箱、密码或任何密钥。
export function saveMockLogin() {
  try {
    const state: MockAuthState = { loggedIn: true, version: 1 };
    window.localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function hasMockLogin() {
  try {
    const value = window.localStorage.getItem(MOCK_AUTH_KEY);
    if (!value) return false;
    const state = JSON.parse(value) as Partial<MockAuthState>;
    return state.loggedIn === true && state.version === 1;
  } catch {
    return false;
  }
}
