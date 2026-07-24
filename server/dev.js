import { spawn } from "node:child_process";

const children = [];

function run(command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...extraEnv },
  });

  children.push(child);
  return child;
}

function shutdown(signal = "SIGTERM") {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

const api = run(process.execPath, ["server/index.js"], { PORT: "8787" });
const vite = run("npx", ["vite"]);

const exitHandler = (signal) => {
  shutdown(signal);
  process.exit(0);
};

process.on("SIGINT", exitHandler);
process.on("SIGTERM", exitHandler);

api.on("exit", (code) => {
  if (code && code !== 0) {
    shutdown("SIGTERM");
    process.exit(code);
  }
});

vite.on("exit", (code) => {
  shutdown("SIGTERM");
  process.exit(code ?? 0);
});
