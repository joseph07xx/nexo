import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

interface RateLimitRule {
  keyHash: string;
  maxAttempts: number;
  windowMs: number;
  blockMs: number;
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function createKeyHash(scope: string, value: string) {
  return createHash("sha256").update(`${scope}:${value}`).digest("hex");
}

export function getClientIp(request: Request) {
  return getClientIpFromHeaders(request.headers);
}

export function getClientIpFromHeaders(headers: Pick<Headers, "get">) {
  return headers.get("x-real-ip")?.trim()
    || headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

export function getLoginRateLimitRules(email: string, ip: string): RateLimitRule[] {
  const normalizedEmail = email.trim().toLowerCase();

  return [
    {
      keyHash: createKeyHash("login-email-ip", `${normalizedEmail}:${ip}`),
      maxAttempts: 6,
      windowMs: LOGIN_WINDOW_MS,
      blockMs: LOGIN_WINDOW_MS,
    },
    {
      keyHash: createKeyHash("login-ip", ip),
      maxAttempts: 30,
      windowMs: LOGIN_WINDOW_MS,
      blockMs: LOGIN_WINDOW_MS,
    },
  ];
}

export function getRegistrationRateLimitRule(ip: string): RateLimitRule {
  return {
    keyHash: createKeyHash("register-ip", ip),
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000,
    blockMs: 60 * 60 * 1000,
  };
}

export async function consumeAuthAttempts(rules: RateLimitRule[]) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const orderedRules = [...rules].sort((first, second) => first.keyHash.localeCompare(second.keyHash));

    for (const rule of orderedRules) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${rule.keyHash}))`;
    }

    const existingRecords = await Promise.all(
      orderedRules.map((rule) => tx.authRateLimit.findUnique({ where: { keyHash: rule.keyHash } }))
    );

    const isBlocked = orderedRules.some((rule, index) => {
      const record = existingRecords[index];
      if (record?.blockedUntil && record.blockedUntil > now) return true;
      if (!record || now.getTime() - record.windowStartedAt.getTime() >= rule.windowMs) return false;
      return record.attempts >= rule.maxAttempts;
    });

    if (isBlocked) {
      for (let index = 0; index < orderedRules.length; index += 1) {
        const rule = orderedRules[index];
        const record = existingRecords[index];
        const windowActive = record
          && now.getTime() - record.windowStartedAt.getTime() < rule.windowMs;
        if (windowActive && record.attempts >= rule.maxAttempts && !record.blockedUntil) {
          await tx.authRateLimit.update({
            where: { keyHash: rule.keyHash },
            data: { blockedUntil: new Date(now.getTime() + rule.blockMs) },
          });
        }
      }
      return false;
    }

    for (let index = 0; index < orderedRules.length; index += 1) {
      const rule = orderedRules[index];
      const existing = existingRecords[index];
      const windowExpired = !existing
        || now.getTime() - existing.windowStartedAt.getTime() >= rule.windowMs;

      await tx.authRateLimit.upsert({
        where: { keyHash: rule.keyHash },
        create: { keyHash: rule.keyHash, attempts: 1, windowStartedAt: now },
        update: {
          attempts: windowExpired ? 1 : (existing?.attempts ?? 0) + 1,
          windowStartedAt: windowExpired ? now : existing!.windowStartedAt,
          blockedUntil: null,
        },
      });
    }

    if (Math.random() < 0.02) {
      await tx.authRateLimit.deleteMany({
        where: { updatedAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
      });
    }

    return true;
  });
}

export async function consumeAuthAttempt(rule: RateLimitRule) {
  return consumeAuthAttempts([rule]);
}

export async function clearAuthRateLimits(rules: RateLimitRule[]) {
  await prisma.authRateLimit.updateMany({
    where: { keyHash: { in: rules.map((rule) => rule.keyHash) } },
    data: { attempts: 0, blockedUntil: null, windowStartedAt: new Date() },
  });
}