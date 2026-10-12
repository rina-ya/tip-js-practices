//Гиниятова АИ
// src/task-extra.js
// Расширение Б: однократная отмена последнего удаления.
// Не изменяет контракты обязательных функций.

export function createUndoState() {
  return { task: null, index: -1 };
}

export function rememberRemoved(undoState, task, index) {
  return { task: { ...task }, index };
}

export function clearUndoState() {
  return { task: null, index: -1 };
}

export function restoreRemoved(tasks, undoState) {
  if (!undoState.task) {
    return { ok: false, error: "Нет удалённой задачи для восстановления" };
  }
  const restored = [...tasks];
  const insertAt = Math.min(Math.max(undoState.index, 0), restored.length);
  restored.splice(insertAt, 0, { ...undoState.task });
  return { ok: true, tasks: restored };
}