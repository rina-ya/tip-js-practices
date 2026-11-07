import { spawn } from "node:child_process";
import { openSync, closeSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

export async function request(url, method = "GET") {
  try { return await fetch(url, { method, signal: AbortSignal.timeout(800) }); }
  catch { return null; }
}

async function isFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

export async function matchesApi(port, practice) {
  const baseUrl = `http://127.0.0.1:${port}/api`;
  const response = await request(`${baseUrl}/tasks`, "OPTIONS");
  if (!response?.ok) return false;
  const methods = (response.headers.get("Access-Control-Allow-Methods") ?? "")
    .split(",").map((method) => method.trim());
  if (!methods.includes("GET") || methods.includes("POST") !== (practice === "06")) return false;
  if (practice === "06" && (!methods.includes("PATCH") || !methods.includes("DELETE"))) return false;
  const health = await request(`${baseUrl}/health`);
  return health?.ok && (await health.json().catch(() => null))?.data?.status === "ok";
}

export async function startServer(directory, script, args, ready) {
  if (await ready()) return null;
  const log = openSync(path.join(directory, "runtime.log"), "a");
  let child;
  try {
    child = spawn(process.execPath, [script, ...args], {
      cwd: directory, detached: true, windowsHide: true, stdio: ["ignore", log, log],
    });
  } finally { closeSync(log); }
  let spawnError;
  child.once("error", (error) => { spawnError = error; });
  child.unref();
  for (let attempt = 0; attempt < 30; attempt++) {
    await delay(150);
    if (spawnError) throw spawnError;
    if (await ready()) return child;
    if (child.exitCode !== null) break;
  }
  child.kill();
  throw new Error(`Не удалось запустить ${script}. Подробности — в ${path.join(directory, "runtime.log")}.`);
}

export async function ensureApi({ practice, directory, ports }) {
  for (const port of new Set(ports)) {
    if (await matchesApi(port, practice)) return { port, child: null };
    if (!await isFree(port)) continue;
    const child = await startServer(directory, "api/server.mjs", [String(port)],
      () => matchesApi(port, practice));
    return { port, child };
  }
  throw new Error(`Не найден свободный порт для API ПР${practice}: ${ports.join(", ")}.`);
}
