//Гиниятова АИ
// Расширение Б: однократная отмена последнего удаления.

import { createUndoState, rememberRemoved, clearUndoState, restoreRemoved } from "../src/task-extra.js";

const results = document.querySelector("#extra-results");
const log = document.querySelector("#extra-log");
const summary = document.querySelector("#extra-summary");
let passed = 0;
let failed = 0;
const transcript = [];

function assert(condition, message = "Условие не выполнено") {
  if (!condition) throw new Error(message);
}

function same(actual, expected, message = "Результаты отличаются") {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${message}: получено ${JSON.stringify(actual)}, ожидалось ${JSON.stringify(expected)}`
  );
}

function check(name, action) {
  const item = document.createElement("li");
  try {
    action();
    passed += 1;
    item.className = "check-pass";
    item.textContent = `OK: ${name}`;
  } catch (error) {
    failed += 1;
    item.className = "check-fail";
    item.textContent = `FAIL: ${name} — ${error.message}`;
  }
  results.append(item);
  transcript.push(item.textContent);
  log.textContent = transcript.join("\n");
}

function tasks() {
  return [
    { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
    { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
    { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
    { id: 10, title: "Оформить README", completed: true, priority: "medium" },
  ];
}

check("Отмена недоступна без удаления", () => {
  const state = createUndoState();
  assert(state.task === null, "Пустое состояние должно быть без задачи");
  const restored = restoreRemoved(tasks(), state);
  assert(restored.ok === false, "Без удаления отмена должна отклоняться");
});

check("Удаление последней записи и отмена возвращает её в конец", () => {
  const input = tasks();
  const removedTask = input[3];
  const state = rememberRemoved(createUndoState(), removedTask, 3);
  const afterRemove = [input[0], input[1], input[2]];
  const restored = restoreRemoved(afterRemove, state);
  assert(restored.ok === true, "Отмена должна успешно вернуть задачу");
  same(restored.tasks.map((t) => t.id), [1, 4, 7, 10]);
  same(restored.tasks[3], removedTask);
  same(afterRemove.map((t) => t.id), [1, 4, 7]);
});

check("Удаление средней записи и отмена возвращает её на прежнюю позицию", () => {
  const input = tasks();
  const removedTask = input[1];
  const state = rememberRemoved(createUndoState(), removedTask, 1);
  const afterRemove = [input[0], input[2], input[3]];
  const restored = restoreRemoved(afterRemove, state);
  same(restored.tasks.map((t) => t.id), [1, 4, 7, 10]);
  same(restored.tasks[1], removedTask);
});

check("Удаление первой записи и отмена возвращает её в начало", () => {
  const input = tasks();
  const removedTask = input[0];
  const state = rememberRemoved(createUndoState(), removedTask, 0);
  const afterRemove = [input[1], input[2], input[3]];
  const restored = restoreRemoved(afterRemove, state);
  same(restored.tasks.map((t) => t.id), [1, 4, 7, 10]);
});

check("Отмена после удаления последней оставшейся задачи", () => {
  const single = [{ id: 1, title: "A", completed: false, priority: "low" }];
  const state = rememberRemoved(createUndoState(), single[0], 0);
  const restored = restoreRemoved([], state);
  assert(restored.ok === true);
  same(restored.tasks.map((t) => t.id), [1]);
});

check("clearUndoState обнуляет память об удалении", () => {
  const state = rememberRemoved(createUndoState(), tasks()[0], 0);
  const cleared = clearUndoState();
  assert(cleared.task === null);
  const restored = restoreRemoved(tasks(), cleared);
  assert(restored.ok === false);
});

check("Новое удаление заменяет предыдущее", () => {
  const input = tasks();
  const firstState = rememberRemoved(createUndoState(), input[0], 0);
  const secondState = rememberRemoved(firstState, input[2], 1);
  same(secondState.task.id, 7);
  same(secondState.index, 1);
});

check("Восстановление не изменяет входной массив", () => {
  const afterRemove = [tasks()[0], tasks()[2], tasks()[3]];
  const before = JSON.parse(JSON.stringify(afterRemove));
  const state = rememberRemoved(createUndoState(), tasks()[1], 1);
  restoreRemoved(afterRemove, state);
  same(afterRemove, before);
});

const conclusion = `Всего: ${passed + failed}. Пройдено: ${passed}. Ошибок: ${failed}.`;
summary.textContent = conclusion;
log.textContent = `${transcript.join("\n")}\n\n${conclusion}`;
document.documentElement.dataset.extraChecksDone = "true";
document.documentElement.dataset.extraChecksPassed = String(passed);
document.documentElement.dataset.extraChecksFailed = String(failed);