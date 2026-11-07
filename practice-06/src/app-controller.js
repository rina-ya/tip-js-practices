import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}


export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  const apiMethods = ["loadInitialData", "getTasks", "createTask", "updateTask", "setTaskCompleted", "deleteTask", "resetDemoData"];
  const viewMethods = ["setListState", "setTasks", "setCategories", "setTotal", "setFormTask", "showFormErrors", "setMutationPending", "notify"];
  if (apiMethods.some((key) => typeof api?.[key] !== "function")
    || viewMethods.some((key) => typeof view?.[key] !== "function") || typeof validateDraft !== "function") {
    throw new TypeError("Некорректные зависимости контроллера.");
  }
  let tasks = [], categories = [], filters = {}, editingId = null;
  let categoriesLoaded = false, requestNumber = 0, activeLoad = null;
  let mutationPending = false, destroyed = false;
  const mutationController = new AbortController();

  async function load() {
    if (destroyed) return;
    activeLoad?.abort();
    activeLoad = new AbortController();
    const number = ++requestNumber;
    const signal = activeLoad.signal;
    view.setListState("loading");
    try {
      const result = categoriesLoaded
        ? await api.getTasks(filters, { signal })
        : await api.loadInitialData(filters, { signal });
      if (destroyed || number !== requestNumber) return;
      if (result.categories) {
        categories = result.categories;
        categoriesLoaded = true;
        view.setCategories(categories);
      }
      tasks = result.tasks;
      view.setTasks(tasks, categories);
      view.setTotal(result.meta.total);
      view.setListState(tasks.length ? "ready" : "empty");
      view.setMutationPending(mutationPending);
    } catch (error) {
      if (destroyed || number !== requestNumber || error.kind === "aborted") return;
      tasks = [];
      view.setTasks([], categories);
      view.setTotal(0);
      view.setListState("error", messageForError(error));
    }
  }

  function cancelEdit() {
    editingId = null;
    view.setFormTask(null);
    view.showFormErrors({});
  }

  async function mutate(operation, message, clearEditor = false) {
    if (destroyed || mutationPending) return;
    mutationPending = true;
    view.setMutationPending(true);
    view.notify("");
    try {
      await operation();
      if (destroyed) return;
      if (clearEditor) cancelEdit();
      await load();
      if (!destroyed) view.notify(message, "success");
    } catch (error) {
      if (!destroyed && error.kind !== "aborted") view.notify(messageForError(error), "error");
    } finally {
      mutationPending = false;
      if (!destroyed) view.setMutationPending(false);
    }
  }

  function findCurrentTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) view.notify("Задача отсутствует в текущем списке.", "error");
    return task;
  }

  return {
    start(initialFilters = {}) { filters = { ...initialFilters }; return load(); },
    applyFilters(next) { filters = { ...next }; return load(); },
    refresh: load,
    beginEdit(id) {
      if (mutationPending || destroyed) return;
      const task = findCurrentTask(id);
      if (!task) return;
      editingId = id;
      view.showFormErrors({});
      view.setFormTask(task);
    },
    cancelEdit,
    async submit(draft) {
      if (mutationPending || destroyed) return;
      const checked = validateDraft(draft, categories);
      view.showFormErrors(checked.errors);
      if (!checked.valid) return;
      const id = editingId;
      return mutate(() => id === null
        ? api.createTask(checked.value, { signal: mutationController.signal })
        : api.updateTask(id, checked.value, { signal: mutationController.signal }), "Задача сохранена.", true);
    },
    async toggleTask(id) {
      const task = findCurrentTask(id);
      if (!task) return;
      return mutate(() => api.setTaskCompleted(id, !task.completed, { signal: mutationController.signal }), "Статус изменён.");
    },
    async deleteTask(id) {
      if (!findCurrentTask(id)) return;
      return mutate(() => api.deleteTask(id, { signal: mutationController.signal }), "Задача удалена.", editingId === id);
    },
    resetData() {
      return mutate(() => api.resetDemoData({ signal: mutationController.signal }), "Исходные данные восстановлены.", true);
    },
    destroy() { destroyed = true; ++requestNumber; activeLoad?.abort(); mutationController.abort(); },
  };
}
