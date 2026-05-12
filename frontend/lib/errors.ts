/** Maps backend `error` string codes to user-facing Chinese copy. */
export function mapApiErrorMessage(message: string): string {
  const map: Record<string, string> = {
    RECAPTCHA_FAILED: "人机验证未通过，请刷新页面后重试。",
    REGISTRATION_IP_LIMIT: "当前网络 24 小时内注册次数已达上限，请稍后再试。",
    EMAIL_NOT_VERIFIED: "请先完成邮箱验证后再使用积分消费功能。",
    EMAIL_ALREADY_VERIFIED: "该邮箱已完成验证。",
    INVALID_OR_EXPIRED_VERIFICATION_TOKEN: "验证链接无效或已过期，请重新发送验证邮件。",
    "Insufficient credits": "积分不足。",
  };
  return map[message] ?? message;
}
