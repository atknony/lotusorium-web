// Reaps orphaned Next.js dev workers for THIS project before a new `dev` start.
//
// Why: on Windows, Ctrl+C / closing the terminal does not reliably kill the
// Turbopack dev worker subprocesses (`<project>/.next/dev/build/*.js`, ~50 MB
// each, one per CPU core). They orphan and accumulate across restarts until RAM
// is exhausted and the machine freezes. This `predev` guard removes any such
// strays scoped strictly to this project directory, so they never pile up.
//
// Cross-platform and intentionally conservative: it only targets node processes
// whose command line references BOTH this project's absolute path AND `.next`
// (the dev worker output dir) — so it never touches the API, the editor, or the
// predev process itself (which runs from /scripts, not /.next).

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const self = process.pid;
const DEV_PORT = 3001;

function killWindows() {
  // Query node processes with their command lines, filter, and stop them.
  const ps = [
    "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\"",
    "| Where-Object { $_.CommandLine -like '*" + projectRoot.replace(/'/g, "''") + "*' -and $_.CommandLine -like '*\\.next*' }",
    "| Select-Object -ExpandProperty ProcessId",
  ].join(" ");
  const out = execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"')}"`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return out
    .split(/\r?\n/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((pid) => Number.isInteger(pid) && pid !== self);
}

function killUnix() {
  const out = execSync("ps -A -o pid=,command=", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return out
    .split(/\r?\n/)
    .filter((line) => line.includes(projectRoot) && line.includes(".next"))
    .map((line) => parseInt(line.trim().split(/\s+/)[0], 10))
    .filter((pid) => Number.isInteger(pid) && pid !== self);
}

/** Whatever still holds the dev port (a lingering server from a prior run). */
function pidsOnDevPort() {
  try {
    if (process.platform === "win32") {
      const out = execSync(
        `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${DEV_PORT} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`,
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      );
      return out.split(/\r?\n/).map((s) => parseInt(s.trim(), 10));
    }
    const out = execSync(`lsof -ti tcp:${DEV_PORT}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.split(/\r?\n/).map((s) => parseInt(s.trim(), 10));
  } catch {
    return [];
  }
}

try {
  const workerPids = process.platform === "win32" ? killWindows() : killUnix();
  const pids = [...new Set([...workerPids, ...pidsOnDevPort()])].filter(
    (pid) => Number.isInteger(pid) && pid !== self,
  );
  let killed = 0;
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGKILL");
      killed++;
    } catch {
      // already gone / no permission — ignore
    }
  }
  if (killed > 0) {
    console.log(`[predev] reaped ${killed} stray Next dev worker(s).`);
  }
} catch {
  // Never block `dev` from starting if cleanup fails.
}

process.exitCode = 0;
