import { createApiClient } from "./api-client.js";
import { createAppController } from "./app-controller.js";
import { createDomView } from "./dom-app.js";
import { createTaskApi } from "./task-api.js";
import { getVariantFilters, variantNumber } from "./variant.js";

function readApiUrl(params, configuredUrl) {
  const value = params.get("api") ?? configuredUrl ?? "http://127.0.0.1:5505/api";
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new TypeError("Неверный протокол API.");
  return url.href.replace(/\/$/, "");
}

const view = createDomView();
const app = { controller: null, ready: null };
window.practice06 = app;
app.ready = startApp();

async function startApp() {
  try {
    const params = new URLSearchParams(window.location.search);
    const settings = params.has("api") ? null
      : await import("./runtime-settings.js").catch(() => null);
    const baseUrl = readApiUrl(params, settings?.apiUrl);
    const initialFilters = params.get("dataset") === "variant"
      ? getVariantFilters(variantNumber)
      : {};
    view.setApiUrl(baseUrl);
    view.setFilters(initialFilters);

    const client = createApiClient({ baseUrl, timeoutMs: 3000 });
    const api = createTaskApi(client);
    const controller = createAppController({ api, view });
    app.controller = controller;

    view.connect({
      submit: (draft) => controller.submit(draft),
      filters: (filters) => controller.applyFilters(filters),
      refresh: () => controller.refresh(),
      cancelEdit: () => controller.cancelEdit(),
      resetData: () => controller.resetData(),
      taskAction(action, id) {
        if (action === "toggle") controller.toggleTask(id);
        if (action === "edit") controller.beginEdit(id);
        if (action === "delete") controller.deleteTask(id);
      },
    });

    await controller.start(initialFilters);
  } catch (error) {
    console.error(error);
    view.setListState("error", "Не удалось запустить приложение. Откройте его через start.cmd.");
  }
}
