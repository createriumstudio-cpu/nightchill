/**
 * Environment variable validation.
 * Import this in server-side code to fail fast on missing configuration.
 */

interface EnvConfig {
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL: string;
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
    ANTHROPIC_API_KEY: getEnvVar("ANTHROPIC_API_KEY"),
    ANTHROPIC_MODEL: getEnvVar("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
    NEXT_PUBLIC_SITE_URL: getEnvVar(
      "NEXT_PUBLIC_SITE_URL",
      "https://nightchill.app"
    ),
  };

  return _env;
}
