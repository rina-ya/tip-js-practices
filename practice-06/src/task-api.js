import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

export function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}


function normalizeFilters(filters) {
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) throw new TypeError("Нужен объект фильтров.");
  const query = {};
  for (const [key, value] of Object.entries(filters)) {
    if (!ALLOWED_FILTERS.has(key)) throw new TypeError(`Неизвестный фильтр: ${key}`);
    if (value === undefined || value === null || value === "") continue;
    if ((key === "completed" && typeof value !== "boolean")
      || (key === "priority" && !ALLOWED_PRIORITIES.has(value))
      || (key === "categoryId" && !isPositiveSafeInteger(value))
      || (key === "q" && (typeof value !== "string" || value.trim().length > 100))) {
      throw new TypeError(`Некорректный фильтр: ${key}`);
    }
    const normalized = key === "q" ? value.trim() : value;
    if (normalized !== "") query[key] = normalized;
  }
  return query;
}

function checkCollection(payload, isItem) {
  if (!payload || !Array.isArray(payload.data) || !payload.data.every(isItem)
    || new Set(payload.data.map((item) => item.id)).size !== payload.data.length
    || payload.meta?.total !== payload.data.length) throw invalidResponse("Неверная схема коллекции.");
  return payload.data;
}

export function createTaskApi(client) {
  if (typeof client?.requestJson !== "function") throw new TypeError("Нужен client.requestJson.");
  function checkedId(id) {
    if (!isPositiveSafeInteger(id)) throw new TypeError("Некорректный ID.");
    return id;
  }
  function single(payload) {
    if (!isTask(payload?.data)) throw invalidResponse("Неверная схема задачи.");
    return payload.data;
  }
  const api = {
    async getTasks(filters = {}, options) {
      const query = normalizeFilters(filters);
      const payload = await client.requestJson("/tasks", { query, ...options });
      const tasks = checkCollection(payload, isTask);
      if (!payload.meta.filters || typeof payload.meta.filters !== "object" || Array.isArray(payload.meta.filters)) {
        throw invalidResponse("Нет meta.filters.");
      }
      return { tasks, meta: payload.meta };
    },
    async getTaskById(id, options) {
      return single(await client.requestJson(`/tasks/${checkedId(id)}`, options));
    },
    async getCategories(options) {
      return checkCollection(await client.requestJson("/categories", options), isCategory);
    },
    async loadInitialData(filters = {}, options) {
      const [result, categories] = await Promise.all([api.getTasks(filters, options), api.getCategories(options)]);
      return { tasks: result.tasks, categories, meta: result.meta };
    },

    async createTask(draft, options) {
      return single(await client.requestJson("/tasks", { ...options, method: "POST", body: draft }));
    },
    async updateTask(id, changes, options) {
      return single(await client.requestJson(`/tasks/${checkedId(id)}`, { ...options, method: "PATCH", body: changes }));
    },
    async setTaskCompleted(id, completed, options) {
      if (typeof completed !== "boolean") throw new TypeError("Нужен boolean-статус.");
      return api.updateTask(id, { completed }, options);
    },
    async deleteTask(id, options) {
      const result = await client.requestJson(`/tasks/${checkedId(id)}`, { ...options, method: "DELETE" });
      if (result !== null) throw invalidResponse("Ожидался пустой ответ 204.");
      return null;
    },
    async resetDemoData(options) {
      const payload = await client.requestJson("/debug/reset", { ...options, method: "POST" });
      if (payload?.data?.reset !== true || !Number.isSafeInteger(payload.data.total) || payload.data.total < 0) {
        throw invalidResponse("Неверное подтверждение сброса.");
      }
      return payload.data;
    },

  };
  return api;
}
