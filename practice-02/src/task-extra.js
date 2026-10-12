//Гиниятова АИ
// src/task-extra.js
// Расширение А: поиск задач по части названия.

export function searchTasks(tasks, query) {
  if (typeof query !== "string") {
    return [];
  }
  const normalized = query.trim().toLowerCase();
  if (normalized === "") {
    return [...tasks];
  }
  return tasks.filter((task) =>
    task.title.toLowerCase().includes(normalized)
  );
}