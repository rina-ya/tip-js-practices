import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureApi, request, startServer } from "./practice-launcher.mjs";
import { readRuntimeApiPort, writeRuntimeSettings } from "../practice-06/tools/runtime-settings.mjs";

const number = process.argv[2];
if (!["04", "05", "06"].includes(number)) {
  console.error("Укажите номер практики: 04, 05 или 06.");
  process.exit(1);
}
const root = fileURLToPath(new URL("../", import.meta.url));
const directory = path.join(root, `practice-${number}`);
const webUrl = `http://127.0.0.1:55${number}/`;

try {
  if (number === "05" || number === "06") {
    const previousPort = number === "06" ? await readRuntimeApiPort() : 5505;
    const ports = number === "05" ? [5505, 5515, 5518] : [previousPort, 5505, 5516, 5517];
    const { port } = await ensureApi({ practice: number, directory, ports });
    const apiUrl = `http://127.0.0.1:${port}/api`;
    console.log(`API ПР${number}: ${apiUrl}`);
    if (number === "05") {
      const exitCode = await new Promise((resolve, reject) => {
        const client = spawn(process.execPath, ["src/main.js"], {
          cwd: directory, env: { ...process.env, API_URL: apiUrl }, stdio: "inherit", windowsHide: true,
        });
        client.once("error", reject);
        client.once("exit", (code) => resolve(code ?? 1));
      });
      process.exitCode = exitCode;
    } else {
      await writeRuntimeSettings(port);
    }
  }
  if (number !== "05") {
    await startServer(directory, number === "04" ? "tools/serve.mjs" : "tools/static-server.mjs", [],
      async () => (await request(`${webUrl}src/main.js`))?.ok);
    console.log(`Приложение готово: ${webUrl}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
