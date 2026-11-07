const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
export function validateTaskDraft(draft, categories) {
  const errors = {};
  const title = typeof draft?.title === "string" ? draft.title.trim() : "";
  if (typeof draft?.title !== "string" || title.length < 1 || title.length > 100) {
    errors.title = "Название должно содержать от 1 до 100 символов.";
  }
  const priority = draft?.priority;
  if (!ALLOWED_PRIORITIES.has(priority)) errors.priority = "Выберите приоритет.";
  const categoryId = Number(draft?.categoryId);
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0 || !categories.some((category) => category.id === categoryId)) {
    errors.categoryId = "Выберите существующую категорию.";
  }
  return { valid: Object.keys(errors).length === 0, value: { title, priority, categoryId }, errors };
}
