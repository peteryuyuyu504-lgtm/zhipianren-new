export type MockLoginResult =
  | { success: true; email: string }
  | { success: false; email: string; message: string };

// 集中处理开发阶段的 Mock 登录规则，不连接服务端，也不保存任何输入。
export function validateMockLogin(email: string, password: string): MockLoginResult {
  const normalizedEmail = email.trim();

  if (password.length < 6) {
    return { success: false, email: normalizedEmail, message: "密码至少需要 6 位" };
  }

  if (normalizedEmail === "fail@gmail.com" && password === "123456") {
    return { success: false, email: normalizedEmail, message: "Mock 登录失败" };
  }

  return { success: true, email: normalizedEmail };
}
