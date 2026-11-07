export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

const ALLOWED_METHODS = ["GET", "POST", "PATCH", "DELETE"];

export function buildUrl(baseUrl, path, query = {}) {
  const url = new URL(`${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== "" && value !== null && value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.href;
}

export function createApiClient({ baseUrl, fetchFn = globalThis.fetch, timeoutMs = 3000 } = {}) {
  let base;
  try { base = new URL(baseUrl); } catch { throw new TypeError("Нужен абсолютный URL API."); }
  if (!["http:", "https:"].includes(base.protocol) || base.search || base.hash
    || typeof fetchFn !== "function" || !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError("Некорректная конфигурация API-клиента.");
  }
  baseUrl = base.href.replace(/\/+$/, "");
  return { async requestJson(path, { query = {}, signal, timeoutMs: limit = timeoutMs,
    method = "GET", body } = {}) {
    method = method.toUpperCase();
    if (!ALLOWED_METHODS.includes(method) || (method === "GET" && body !== undefined)) {
      throw new TypeError("Недопустимый метод или тело GET.");
    }
    if (!Number.isSafeInteger(limit) || limit <= 0) throw new TypeError("Некорректный тайм-аут.");
    const url = buildUrl(baseUrl, path, query);
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort(signal.reason);
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, limit);
    try {
      const headers = { Accept: "application/json" };
      const options = { method, headers, signal: controller.signal };
      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
      }
      const response = await fetchFn(url, options);
      if (!response || typeof response.json !== "function" || !response.headers
        || typeof response.ok !== "boolean") {
        throw new ApiError("Некорректный HTTP-ответ.", { kind: "invalid-response", url });
      }
      if (!response.ok) {
        let payload;
        try { payload = await response.json(); } catch { /* HTTP-статус важнее тела. */ }
        throw new ApiError(payload?.error?.message || `HTTP ${response.status}`, {
          kind: "http", status: response.status, url,
          code: payload?.error?.code ?? null, details: payload?.error?.details ?? null,
        });
      }
      if (response.status === 204) return null;
      if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get("Content-Type") ?? "")) {
        throw new ApiError("Ожидался JSON.", { kind: "invalid-response", url });
      }
      try { return await response.json(); }
      catch (cause) {
        if (controller.signal.aborted) throw cause;
        throw new ApiError("Повреждённый JSON.", { kind: "invalid-response", url, cause });
      }
    } catch (cause) {
      if (cause instanceof ApiError) throw cause;
      const kind = timedOut ? "timeout" : controller.signal.aborted ? "aborted" : "network";
      const message = timedOut ? "Превышено время ожидания." : kind === "aborted" ? "Запрос отменён." : "Нет соединения с API.";
      throw new ApiError(message, { kind, url, cause });
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }
  } };
}
