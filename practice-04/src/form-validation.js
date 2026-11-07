const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Чистая проверка: исходные данные и DOM не изменяются.
export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  const rawId = draft?.id;
  const id = editingId === null ? Number(rawId) : editingId;
  if ((editingId === null && ((typeof rawId !== "string" && typeof rawId !== "number")
      || (typeof rawId === "string" && rawId.trim() === "")))
      || !Number.isSafeInteger(id) || id <= 0) {
    errors.id = "ID должен быть положительным безопасным целым числом.";
  } else if (editingId === null && tasks.some((task) => task.id === id)) {
    errors.id = "Задача с таким ID уже существует.";
  } else if (editingId !== null && !tasks.some((task) => task.id === id)) {
    errors.id = "Редактируемая задача не найдена.";
  }
  const title = typeof draft?.title === "string" ? draft.title.trim() : "";
  if (typeof draft?.title !== "string" || title.length < 1 || title.length > 100) {
    errors.title = "Название должно содержать от 1 до 100 символов после trim().";
  }
  const priority = draft?.priority;
  if (!ALLOWED_PRIORITIES.has(priority)) errors.priority = "Выберите low, medium или high.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { id, title, priority } };
}
