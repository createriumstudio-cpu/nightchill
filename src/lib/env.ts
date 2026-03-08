/**
 * Environment variable validation.
 * Import this in server-side code to fail fast on missing configuration.
 */

interface EnvConfig {
  ANTHROPIC_API_KEY: string | undefined;
  ANTHROPIC_MODEL: string;
  GEMINI_API_KEY: string | undefined;
  GEMINI_MODEL: string;
  NEXT_PUBLIC_SITE_URL: string;
}

function getEnvVar(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `See .env.example for reference.`
    );
  }
  return value;
}

let _env: EnvConfig | null = null;

export function env(): EnvConfig {
  if (_env) return _env;

  _env = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || undefined,
    ANTHROPIC_MODEL: getEnvVar("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
    GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    NEXT_PUBLIC_SITE_URL: getEnvVar(
      "NEXT_PUBLIC_SITE_URL",
      "https://futatabito.com"
    ),
  };

  return _env;
}
