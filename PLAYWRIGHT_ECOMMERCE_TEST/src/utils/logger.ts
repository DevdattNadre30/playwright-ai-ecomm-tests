export type LogLevel = "debug" | "info" | "warn" | "error";

const priorities: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function configuredLevel(): LogLevel {
  const requestedLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  return requestedLevel && requestedLevel in priorities ? requestedLevel : "info";
}

function write(level: LogLevel, message: string, details?: unknown): void {
  if (priorities[level] < priorities[configuredLevel()]) {
    return;
  }

  const output = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
  const stream = level === "error" ? console.error : level === "warn" ? console.warn : console.log;

  if (details === undefined) {
    stream(output);
  } else {
    stream(output, details);
  }
}

export const logger = {
  debug: (message: string, details?: unknown): void => write("debug", message, details),
  info: (message: string, details?: unknown): void => write("info", message, details),
  warn: (message: string, details?: unknown): void => write("warn", message, details),
  error: (message: string, details?: unknown): void => write("error", message, details),
};
