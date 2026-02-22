import rateLimit from "express-rate-limit";

const getClientIp = (req: any) => {
  const forwarded = (req.headers["x-forwarded-for"] as string | undefined) || "";
  const ip = forwarded.split(",")[0]?.trim();
  return ip || req.ip || req.connection?.remoteAddress || "unknown";
};

const maroonRateLimitHandler = (req: any, res: any) => {
  const ip = getClientIp(req);
  console.warn(`[SECURITY_ALERT] Rate limit exceeded by IP: ${ip}`);

  const correlationId = req?.correlationId || "-";

  return res.status(429).json({
    success: false,
    message: "Too many requests, please try again later.",
    theme: {
      primary: "#4b1927"
    },
    correlationId
  });
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => getClientIp(req),
  handler: maroonRateLimitHandler
});

export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => getClientIp(req),
  handler: maroonRateLimitHandler
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => getClientIp(req),
  handler: maroonRateLimitHandler
});
