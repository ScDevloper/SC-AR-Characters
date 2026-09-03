import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const [, , entrypoint, ...args] = process.argv;

if (!entrypoint) {
  console.error("Missing CLI entrypoint.");
  process.exit(1);
}

const logPath = resolve(".wrangler", "wrangler.log");
mkdirSync(dirname(logPath), { recursive: true });

const child = spawn(process.execPath, [resolve(entrypoint), ...args], {
  env: {
    ...process.env,
    WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH ?? logPath,
  },
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
