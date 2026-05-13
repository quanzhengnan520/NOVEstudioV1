/** Maps backend `error` strings to user-facing copy (exact codes + fuzzy phrases). */
const EXACT_ERROR_MAP: Record<string, string> = {
  RECAPTCHA_FAILED: "人机验证未通过，请刷新页面后重试。",
  REGISTRATION_IP_LIMIT: "当前网络 24 小时内注册次数已达上限，请稍后再试。",
  EMAIL_NOT_VERIFIED: "请先完成邮箱验证后再使用积分消费功能。",
  EMAIL_ALREADY_VERIFIED: "该邮箱已完成验证。",
  INVALID_OR_EXPIRED_VERIFICATION_TOKEN: "验证链接无效或已过期，请重新发送验证邮件。",
  "Insufficient credits": "积分不足，请前往积分页面充值后再试。",
};

export function mapApiErrorMessage(raw: string): string {
  const trimmed = String(raw ?? "").trim();
  if (trimmed && EXACT_ERROR_MAP[trimmed]) {
    return EXACT_ERROR_MAP[trimmed];
  }

  const s = trimmed.toLowerCase();

  // 网络/连接
  if (s.includes("failed to fetch") || s.includes("network")) return "网络连接失败，请检查网络后重试。";

  // 认证
  if (s.includes("401") || s.includes("unauthorized")) return "登录已过期，请重新登录。";
  if (s.includes("403") || s.includes("forbidden")) return "没有权限执行此操作。";

  // 积分
  if (s.includes("insufficient") || s.includes("credits")) return "积分不足，请前往积分页面充值后再试。";
  if (s.includes("freeze") || s.includes("reserved")) return "积分冻结中，请等待当前任务完成。";

  // 频率限制
  if (s.includes("429") || s.includes("rate limit") || s.includes("too many")) return "请求太频繁，请稍等片刻后再试。";

  // 服务商错误
  if (s.includes("dashscope") || s.includes("wanx")) return "图像服务繁忙，请稍后重试。";
  if (s.includes("ark") || s.includes("volcengine")) return "视频服务繁忙，请稍后重试。";
  if (s.includes("deepseek")) return "对话服务繁忙，请稍后重试。";
  if (s.includes("circuit")) return "AI 服务暂时不可用，我们正在恢复中，请稍后再试。";

  // 验证
  if (s.includes("verify") || s.includes("email")) return "请先验证邮箱后再使用创作功能。";

  // 通用
  if (s.includes("timeout")) return "请求超时，请重试。";
  if (s.includes("500") || s.includes("internal")) return "服务器内部错误，请稍后重试。";

  // 原始消息兜底（截断过长内容）
  const clean = trimmed.replace(/HTTP \d+:\s*/, "").replace(/\{.*\}/, "").trim();
  return clean.length > 80 ? `${clean.slice(0, 80)}…` : clean || "操作失败，请重试。";
}
