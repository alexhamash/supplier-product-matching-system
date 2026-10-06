import dotenv from "dotenv";

dotenv.config();

// ─── Environment Helpers ────────────────────────────────────────────────────

/**
 * `true` when the application is running in production mode.
 */
export const isProduction = (): boolean =>
  process.env.NODE_ENV === "production";

// ─── JWT Secret ─────────────────────────────────────────────────────────────

/**
 * Insecure fallback used ONLY in non-production environments so that local
 * development works out of the box. Never used when NODE_ENV === "production".
 */
const DEV_FALLBACK_JWT_SECRET = "dev-secret-change-me";

/**
 * Resolve and validate the JWT signing secret.
 *
 * - In production, a missing `JWT_SECRET` is a fatal configuration error and
 *   the process is terminated immediately (fail-fast on boot).
 * - In development, a fallback secret is used but a loud warning is logged so
 *   the developer is aware that tokens are not secure.
 */
const resolveJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (secret && secret.trim().length > 0) {
    return secret;
  }

  if (isProduction()) {
    // Fail fast: never silently fall back to an insecure default in production.
    console.error(
      "[config] FATAL: JWT_SECRET is not set. Refusing to start in production " +
        "without a secure JWT secret. Set the JWT_SECRET environment variable.",
    );
    throw new Error(
      "JWT_SECRET is required in production but was not provided.",
    );
  }

  console.warn(
    "──────────────────────────────────────────────────────────────────────\n" +
      "[config] WARNING: JWT_SECRET is not set. Falling back to an INSECURE\n" +
      "[config] development secret. DO NOT use this configuration in production.\n" +
      "──────────────────────────────────────────────────────────────────────",
  );

  return DEV_FALLBACK_JWT_SECRET;
};

/**
 * The validated JWT signing/verification secret.
 *
 * Accessing this value in production without `JWT_SECRET` set will throw,
 * preventing the server from booting with an insecure configuration.
 */
export const JWT_SECRET: string = resolveJwtSecret();

/**
 * JWT token lifetime (e.g. "7d", "1h"). Defaults to 7 days.
 */
export const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

// ─── CORS Configuration ─────────────────────────────────────────────────────

/**
 * Default origins permitted during local development when neither
 * `ALLOWED_ORIGINS` nor `CLIENT_URL` is configured.
 */
const DEV_DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
];

/**
 * Parse a comma-separated list of origins into a trimmed, non-empty array.
 */
const parseOrigins = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

/**
 * Resolve the list of allowed CORS origins.
 *
 * Priority:
 *   1. `ALLOWED_ORIGINS` (comma-separated)
 *   2. `CLIENT_URL` (comma-separated)
 *   3. Development fallback: localhost:5173 and localhost:3000
 *
 * In production, if no origins are configured the list is empty, which means
 * cross-origin browser requests are denied by default (secure-by-default).
 */
export const getAllowedOrigins = (): string[] => {
  const fromAllowed = parseOrigins(process.env.ALLOWED_ORIGINS);
  if (fromAllowed.length > 0) {
    return fromAllowed;
  }

  const fromClientUrl = parseOrigins(process.env.CLIENT_URL);
  if (fromClientUrl.length > 0) {
    return fromClientUrl;
  }

  if (!isProduction()) {
    return [...DEV_DEFAULT_ORIGINS];
  }

  return [];
};

/**
 * CORS origin callback used by the `cors` middleware.
 *
 * Requests without an `Origin` header (e.g. server-to-server, curl, health
 * checks) are always allowed. Browser requests are only allowed when their
 * origin is present in the configured allow-list.
 */
export const corsOriginDelegate = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void => {
  // Non-browser requests have no Origin header — allow them.
  if (!origin) {
    callback(null, true);
    return;
  }

  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin '${origin}' is not allowed by CORS policy.`));
};
