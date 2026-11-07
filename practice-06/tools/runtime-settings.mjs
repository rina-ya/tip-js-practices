import { readFile, writeFile } from "node:fs/promises";

const settingsFile = new URL("../src/runtime-settings.js", import.meta.url);

export async function readRuntimeApiPort() {
  try {
    const text = await readFile(settingsFile, "utf8");
    const match = text.match(/^export const apiUrl = ("[^"\r\n]*");/);
    const url = new URL(JSON.parse(match[1]));
    const port = Number(url.port);
    if (url.protocol === "http:" && url.hostname === "127.0.0.1"
      && Number.isInteger(port) && port >= 1024 && port <= 65535) return port;
  } catch { /* До первого запуска используется стандартный порт. */ }
  return 5505;
}

export async function writeRuntimeSettings(port) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new TypeError("Некорректный порт API.");
  const apiUrl = `http://127.0.0.1:${port}/api`;
  await writeFile(settingsFile, `export const apiUrl = ${JSON.stringify(apiUrl)};\n`, "utf8");
}
