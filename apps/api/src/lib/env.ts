export const env = {
  jwtSecret: process.env.JWT_SECRET || "change_me",
  jwtIssuer: process.env.JWT_ISSUER || "telcocredit",
  jwtAudience: process.env.JWT_AUDIENCE || "telcocredit-web",
  tokenTtlSeconds: Number(process.env.TOKEN_TTL_SECONDS || 86400),

  redisHost: process.env.REDIS_HOST || "localhost",
  redisPort: Number(process.env.REDIS_PORT || 6379),

  smtpHost: process.env.SMTP_HOST || "localhost",
  smtpPort: Number(process.env.SMTP_PORT || 1025),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "TelcoCredit <no-reply@telcocredit.local>",

  simGatewayUrl: process.env.SIM_GATEWAY_URL || "http://localhost:5050",
  simGatewayApiKey: process.env.SIM_GATEWAY_API_KEY || "dev_key",

  paymentTermsDays: Number(process.env.PAYMENT_TERMS_DAYS || 7),
  autoSuspendAfterDaysOverdue: Number(process.env.AUTO_SUSPEND_AFTER_DAYS_OVERDUE || 14),
  enableAutoSuspend: (process.env.ENABLE_AUTO_SUSPEND || "false") === "true",

  platformFeeMonthly: Number(process.env.PLATFORM_FEE_MONTHLY || 99)
};
