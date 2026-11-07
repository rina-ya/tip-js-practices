import assert from "node:assert/strict";
import net from "node:net";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { createApiServer as createReadOnlyApi } from "../practice-05/api/server.mjs";
import { createApiServer as createWritableApi } from "../practice-06/api/server.mjs";
import { ensureApi, matchesApi } from "./practice-launcher.mjs";

const servers = [];
const children = [];
let passed = 0;
async function listen(server) {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  servers.push(server);
  return server.address().port;
}
async function freePort() {
  const server = net.createServer();
  const port = await listen(server);
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function check(name, action) {
  await action();
  passed++;
  console.log(`OK: ${name}`);
}

try {
  const readPort = await listen(createReadOnlyApi());
  const writePort = await listen(createWritableApi());
  const directory5 = fileURLToPath(new URL("../practice-05/", import.meta.url));
  const directory6 = fileURLToPath(new URL("../practice-06/", import.meta.url));
  await check("ПР5 и ПР6 различают возможности двух API", async () => {
    assert.equal(await matchesApi(readPort, "05"), true);
    assert.equal(await matchesApi(readPort, "06"), false);
    assert.equal(await matchesApi(writePort, "06"), true);
    assert.equal(await matchesApi(writePort, "05"), false);
  });
  await check("ПР6 пропускает порт ПР5 и сохраняет данные работающего API", async () => {
    const created = await (await fetch(`http://127.0.0.1:${writePort}/api/tasks`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Существующая задача", priority: "high", categoryId: 2 }),
    })).json();
    const selected = await ensureApi({ practice: "06", directory: directory6, ports: [readPort, writePort] });
    assert.equal(selected.port, writePort);
    assert.equal(selected.child, null);
    const response = await fetch(`http://127.0.0.1:${writePort}/api/tasks/${created.data.id}`);
    assert.equal((await response.json()).data.title, "Существующая задача");
  });
  await check("ПР5 использует свой неизменяемый набор при работающей ПР6", async () => {
    const selected = await ensureApi({ practice: "05", directory: directory5, ports: [writePort, readPort] });
    assert.equal(selected.port, readPort);
    const result = await (await fetch(`http://127.0.0.1:${selected.port}/api/tasks?completed=false&priority=high`)).json();
    assert.deepEqual(result.data.map((task) => task.id), [4, 13, 34]);
  });
  for (const [practice, directory, occupied] of [["05", directory5, writePort], ["06", directory6, readPort]]) {
    await check(`Холодный запуск ПР${practice} выбирает свободный порт; повторный запуск не создаёт новый сервер`, async () => {
      const port = await freePort();
      const selected = await ensureApi({ practice, directory, ports: [occupied, port] });
      if (selected.child) children.push(selected.child);
      assert.equal(selected.port, port);
      assert.ok(selected.child);
      assert.equal(await matchesApi(port, practice), true);
      const reused = await ensureApi({ practice, directory, ports: [occupied, port] });
      assert.equal(reused.port, port);
      assert.equal(reused.child, null);
    });
  }
  console.log(`Проверок запуска: ${passed}; ошибок: 0.`);
} finally {
  await Promise.all(children.map(async (child) => {
    const exited = once(child, "exit");
    child.kill();
    await exited;
  }));
  await Promise.all(servers.filter((server) => server.listening).map((server) =>
    new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); })));
}
