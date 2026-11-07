import { config as loadDotEnv } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface EnvironmentConfig {
  environments: Record<string, { baseUrl: string }>;
  activeEnvironment: string;
}

export interface ActiveEnvironment {
  name: string;
  baseUrl: string;
}

let environmentConfig: EnvironmentConfig | undefined;

function readConfig(): EnvironmentConfig {
  if (!environmentConfig) {
    const configPath = resolve(__dirname, "config.json");
    environmentConfig = JSON.parse(readFileSync(configPath, "utf8")) as EnvironmentConfig;
  }

  return environmentConfig;
}

export function getActiveEnvironment(): ActiveEnvironment {
  loadDotEnv({ path: resolve(process.cwd(), ".env.local"), quiet: true });

  const config = readConfig();
  const name = process.env.TEST_ENV ?? config.activeEnvironment;
  const environment = config.environments[name];

  if (!environment) {
    throw new Error(
      `Unknown TEST_ENV "${name}". Available environments: ${Object.keys(config.environments).join(", ")}.`,
    );
  }

  const baseUrl = process.env.BASE_URL ?? environment.baseUrl;
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(baseUrl);
  } catch (error) {
    throw new Error(`Invalid base URL "${baseUrl}" for environment "${name}".`, { cause: error });
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`The base URL for "${name}" must use HTTP or HTTPS.`);
  }

  return { name, baseUrl };
}
