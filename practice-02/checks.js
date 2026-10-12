//Гиниятова АИ
// Проверочные сценарии для ПР2. Запуск: node checks.js или npm run check.

import assert from "node:assert/strict";
import { demoTasks, variantTasks } from "./src/data.js";
import {
  createTask,
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./src/task-service.js";

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`OK: ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`FAIL: ${name}`);
    console.log(`  ${error.message}`);
  }
}

// Вспомогательная функция: снимок состояния массива задач.
function snapshot(tasks) {
  return tasks.map((task) => ({ ...task }));
}

// Проверка: входной массив и его объекты не изменились.
function assertNoMutation(original, before) {
  assert.equal(original.length, before.length, "Длина входного массива изменилась");
  for (let i = 0; i < before.length; i += 1) {
    assert.deepEqual(original[i], before[i], `Задача с индексом ${i} изменилась`);
  }
}

console.log("Проверки createTask");
check("createTask: успешное создание с приоритетом high", () => {
  const result = createTask(20, "Новая задача", "high");
  assert.equal(result.ok, true);
  assert.equal(result.task.id, 20);
  assert.equal(result.task.title, "Новая задача");
  assert.equal(result.task.completed, false);
  assert.equal(result.task.priority, "high");
});

check("createTask: приоритет по умолчанию medium", () => {
  const result = createTask(21, "Без приоритета");
  assert.equal(result.ok, true);
  assert.equal(result.task.priority, "medium");
});

check("createTask: приоритет undefined даёт medium", () => {
  const result = createTask(22, "С undefined", undefined);
  assert.equal(result.ok, true);
  assert.equal(result.task.priority, "medium");
});

check("createTask: title обрезается по краям", () => {
  const result = createTask(23, "  Проверить  данные  ");
  assert.equal(result.ok, true);
  assert.equal(result.task.title, "Проверить  данные");
});

check("createTask: title длиной 1 проходит", () => {
  const result = createTask(24, "A");
  assert.equal(result.ok, true);
});

check("createTask: title длиной 100 проходит", () => {
  const long = "A".repeat(100);
  const result = createTask(25, long);
  assert.equal(result.ok, true);
});

check("createTask: title длиной 101 отклоняется", () => {
  const long = "A".repeat(101);
  const result = createTask(26, long);
  assert.equal(result.ok, false);
});

check("createTask: пустая строка и пробелы отклоняются", () => {
  assert.equal(createTask(27, "").ok, false);
  assert.equal(createTask(28, "   ").ok, false);
});

check("createTask: title не строка отклоняется", () => {
  assert.equal(createTask(29, 42).ok, false);
  assert.equal(createTask(30, null).ok, false);
  assert.equal(createTask(31, undefined).ok, false);
});

check("createTask: некорректный id отклоняется", () => {
  assert.equal(createTask(0, "A").ok, false);
  assert.equal(createTask(-1, "A").ok, false);
  assert.equal(createTask(1.5, "A").ok, false);
  assert.equal(createTask("4", "A").ok, false);
  assert.equal(createTask(NaN, "A").ok, false);
  assert.equal(createTask(Infinity, "A").ok, false);
  assert.equal(createTask(null, "A").ok, false);
  assert.equal(createTask(undefined, "A").ok, false);
});

check("createTask: Number.MAX_SAFE_INTEGER проходит", () => {
  const result = createTask(Number.MAX_SAFE_INTEGER, "A");
  assert.equal(result.ok, true);
});

check("createTask: Number.MAX_SAFE_INTEGER + 1 отклоняется", () => {
  const result = createTask(Number.MAX_SAFE_INTEGER + 1, "A");
  assert.equal(result.ok, false);
});

check("createTask: некорректный приоритет отклоняется", () => {
  assert.equal(createTask(40, "A", "urgent").ok, false);
  assert.equal(createTask(41, "A", "HIGH").ok, false);
  assert.equal(createTask(42, "A", " high ").ok, false);
  assert.equal(createTask(43, "A", null).ok, false);
  assert.equal(createTask(44, "A", 1).ok, false);
});

check("createTask: два вызова дают разные объекты", () => {
  const a = createTask(50, "A");
  const b = createTask(50, "A");
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  assert.notEqual(a.task, b.task);
  assert.deepEqual(a.task, b.task);
});

console.log("Проверки чтения");
check("findTaskById: находит id = 4", () => {
  const found = findTaskById(demoTasks, 4);
  assert.equal(found.id, 4);
  assert.equal(found.title, "Подготовить модель задач");
});

check("findTaskById: отсутствующий id даёт undefined", () => {
  assert.equal(findTaskById(demoTasks, 777), undefined);
});

check("findTaskById: строковый id не совпадает", () => {
  assert.equal(findTaskById(demoTasks, "4"), undefined);
});

check("findTaskById: пустой массив даёт undefined", () => {
  assert.equal(findTaskById([], 4), undefined);
});

check("getPendingTasks: возвращает id [4, 7]", () => {
  const pending = getPendingTasks(demoTasks);
  assert.deepEqual(pending.map((t) => t.id), [4, 7]);
});

check("getPendingTasks: пустой массив даёт []", () => {
  assert.deepEqual(getPendingTasks([]), []);
});

check("getPendingTasks: все выполнены даёт []", () => {
  const allDone = [
    { id: 1, title: "A", completed: true, priority: "low" },
    { id: 2, title: "B", completed: true, priority: "high" },
  ];
  assert.deepEqual(getPendingTasks(allDone), []);
});

check("getPendingTasks: ничего не выполнено даёт все записи", () => {
  const noneDone = [
    { id: 1, title: "A", completed: false, priority: "low" },
    { id: 2, title: "B", completed: false, priority: "high" },
  ];
  assert.equal(getPendingTasks(noneDone).length, 2);
});

check("getTaskTitles: возвращает названия в порядке", () => {
  const titles = getTaskTitles(demoTasks);
  assert.deepEqual(titles, [
    "Изучить функции",
    "Подготовить модель задач",
    "Проверить методы массивов",
    "Оформить README",
  ]);
});

check("getTaskTitles: пустой массив даёт []", () => {
  assert.deepEqual(getTaskTitles([]), []);
});

check("getTaskStats: сводка общего набора", () => {
  const stats = getTaskStats(demoTasks);
  assert.deepEqual(stats, { total: 4, completed: 2, pending: 2, progress: 50 });
});

check("getTaskStats: пустой массив даёт нули", () => {
  const stats = getTaskStats([]);
  assert.deepEqual(stats, { total: 0, completed: 0, pending: 0, progress: 0 });
});

check("getTaskStats: ничего не выполнено — progress 0", () => {
  const noneDone = [
    { id: 1, title: "A", completed: false, priority: "low" },
    { id: 2, title: "B", completed: false, priority: "high" },
  ];
  assert.equal(getTaskStats(noneDone).progress, 0);
});

check("getTaskStats: всё выполнено — progress 100", () => {
  const allDone = [
    { id: 1, title: "A", completed: true, priority: "low" },
    { id: 2, title: "B", completed: true, priority: "high" },
  ];
  assert.equal(getTaskStats(allDone).progress, 100);
});

check("getTaskStats: одна из трёх — progress около 33.33", () => {
  const tasks = [
    { id: 1, title: "A", completed: true, priority: "low" },
    { id: 2, title: "B", completed: false, priority: "high" },
    { id: 3, title: "C", completed: false, priority: "medium" },
  ];
  const stats = getTaskStats(tasks);
  assert.equal(stats.total, 3);
  assert.equal(stats.completed, 1);
  assert.equal(stats.pending, 2);
  assert.ok(Math.abs(stats.progress - 100 / 3) < 1e-9);
});

console.log("Проверки изменения");
check("addTask: добавление id = 20 в общий набор", () => {
  const before = snapshot(demoTasks);
  const result = addTask(demoTasks, 20, "Добавить проверку", "high");
  assert.equal(result.ok, true);
  assert.equal(result.tasks.length, 5);
  assert.equal(result.tasks[4].id, 20);
  assert.equal(demoTasks.length, 4);
  assertNoMutation(demoTasks, before);
});

check("addTask: добавление в пустой массив", () => {
  const empty = [];
  const result = addTask(empty, 20, "A", "low");
  assert.equal(result.ok, true);
  assert.equal(result.tasks.length, 1);
  assert.equal(empty.length, 0);
});

check("addTask: существующий id отклоняется", () => {
  const before = snapshot(demoTasks);
  const result = addTask(demoTasks, 4, "Дубликат", "low");
  assert.equal(result.ok, false);
  assertNoMutation(demoTasks, before);
});

check("addTask: некорректное поле отклоняется", () => {
  const before = snapshot(demoTasks);
  assert.equal(addTask(demoTasks, 30, "").ok, false);
  assert.equal(addTask(demoTasks, 30, "A", "urgent").ok, false);
  assertNoMutation(demoTasks, before);
});

check("setTaskCompleted: id = 4 -> true, затем false", () => {
  const before = snapshot(demoTasks);
  const first = setTaskCompleted(demoTasks, 4, true);
  assert.equal(first.ok, true);
  assert.equal(first.tasks.find((t) => t.id === 4).completed, true);
  assert.equal(demoTasks.find((t) => t.id === 4).completed, false);
  assertNoMutation(demoTasks, before);

  const second = setTaskCompleted(first.tasks, 4, false);
  assert.equal(second.ok, true);
  assert.equal(second.tasks.find((t) => t.id === 4).completed, false);
});

check("setTaskCompleted: неверный тип completed отклоняется", () => {
  const before = snapshot(demoTasks);
  assert.equal(setTaskCompleted(demoTasks, 4, "true").ok, false);
  assert.equal(setTaskCompleted(demoTasks, 4, 1).ok, false);
  assert.equal(setTaskCompleted(demoTasks, 4, null).ok, false);
  assert.equal(setTaskCompleted(demoTasks, 4, undefined).ok, false);
  assertNoMutation(demoTasks, before);
});

check("setTaskCompleted: отсутствующий id отклоняется", () => {
  const before = snapshot(demoTasks);
  assert.equal(setTaskCompleted(demoTasks, 777, true).ok, false);
  assertNoMutation(demoTasks, before);
});

check("renameTask: id = 10 с краевыми пробелами", () => {
  const before = snapshot(demoTasks);
  const result = renameTask(demoTasks, 10, "  Подготовить инструкцию запуска  ");
  assert.equal(result.ok, true);
  const updated = result.tasks.find((t) => t.id === 10);
  assert.equal(updated.title, "Подготовить инструкцию запуска");
  assert.equal(updated.completed, true);
  assert.equal(updated.priority, "medium");
  assertNoMutation(demoTasks, before);
});

check("renameTask: некорректное название отклоняется", () => {
  const before = snapshot(demoTasks);
  assert.equal(renameTask(demoTasks, 10, "").ok, false);
  assert.equal(renameTask(demoTasks, 10, "   ").ok, false);
  assert.equal(renameTask(demoTasks, 10, "A".repeat(101)).ok, false);
  assert.equal(renameTask(demoTasks, 10, 42).ok, false);
  assertNoMutation(demoTasks, before);
});

check("renameTask: отсутствующий id отклоняется", () => {
  const before = snapshot(demoTasks);
  assert.equal(renameTask(demoTasks, 777, "A").ok, false);
  assertNoMutation(demoTasks, before);
});

check("removeTask: id = 7 удаляется", () => {
  const before = snapshot(demoTasks);
  const result = removeTask(demoTasks, 7);
  assert.equal(result.ok, true);
  assert.deepEqual(result.tasks.map((t) => t.id), [1, 4, 10]);
  assertNoMutation(demoTasks, before);
});

check("removeTask: единственная задача удаляется", () => {
  const single = [{ id: 1, title: "A", completed: false, priority: "low" }];
  const result = removeTask(single, 1);
  assert.equal(result.ok, true);
  assert.deepEqual(result.tasks, []);
  assert.equal(single.length, 1);
});

check("removeTask: отсутствующий id отклоняется", () => {
  const before = snapshot(demoTasks);
  assert.equal(removeTask(demoTasks, 777).ok, false);
  assert.equal(removeTask([], 1).ok, false);
  assertNoMutation(demoTasks, before);
});

console.log("Проверки варианта 1");
check("variantTasks: 6 записей с нужными id", () => {
  assert.deepEqual(
    variantTasks.map((t) => t.id),
    [11, 23, 37, 41, 58, 64]
  );
});

check("variantTasks: изначально не выполнено ни одной", () => {
  assert.equal(variantTasks.every((t) => t.completed === false), true);
});

check("variantTasks: начальный прогресс 0", () => {
  assert.equal(getTaskStats(variantTasks).progress, 0);
});

check("variantTasks: addTask(80, ..., high)", () => {
  const before = snapshot(variantTasks);
  const result = addTask(variantTasks, 80, "Новая задача варианта", "high");
  assert.equal(result.ok, true);
  assert.equal(result.tasks.length, 7);
  assert.equal(result.tasks[6].id, 80);
  assert.equal(result.tasks[6].priority, "high");
  assertNoMutation(variantTasks, before);
});

check("variantTasks: повторное добавление id = 80 отклоняется", () => {
  const withNew = addTask(variantTasks, 80, "Новая задача варианта", "high");
  assert.equal(withNew.ok, true);
  const before = snapshot(withNew.tasks);
  const again = addTask(withNew.tasks, 80, "Ещё раз", "low");
  assert.equal(again.ok, false);
  assertNoMutation(withNew.tasks, before);
});
console.log("Собственные проверки");

check("Собственная 1: добавление после удаления", () => {
  const before = snapshot(demoTasks);
  const removed = removeTask(demoTasks, 1);
  assert.equal(removed.ok, true);
  assert.equal(removed.tasks.length, 3);

  const added = addTask(removed.tasks, 99, "Новая после удаления", "low");
  assert.equal(added.ok, true);
  assert.equal(added.tasks.length, 4);
  assert.equal(added.tasks[3].id, 99);
  assert.equal(added.tasks[3].priority, "low");
  assertNoMutation(demoTasks, before);
});

check("Собственная 2: изменение первой записи", () => {
  const before = snapshot(demoTasks);
  const result = setTaskCompleted(demoTasks, 1, false);
  assert.equal(result.ok, true);
  assert.equal(result.tasks[0].completed, false);
  assert.equal(result.tasks[1].completed, false);
  assert.equal(result.tasks[2].completed, false);
  assert.equal(result.tasks[3].completed, true);
  assertNoMutation(demoTasks, before);
});

check("Собственная 3: последовательное обновление двух задач", () => {
  const before = snapshot(demoTasks);

  const step1 = setTaskCompleted(demoTasks, 4, true);
  assert.equal(step1.ok, true);
  assert.equal(step1.tasks.find((t) => t.id === 4).completed, true);

  const step2 = renameTask(step1.tasks, 10, "Новое имя задачи");
  assert.equal(step2.ok, true);
  const updated = step2.tasks.find((t) => t.id === 10);
  assert.equal(updated.title, "Новое имя задачи");
  assert.equal(updated.completed, true);
  assert.equal(updated.priority, "medium");

  assertNoMutation(demoTasks, before);
});
import { searchTasks } from "./src/task-extra.js";

console.log("Собственные проверки расширения А");

check("searchTasks: обычный запрос", () => {
  const result = searchTasks(demoTasks, "функции");
  assert.deepEqual(result.map((t) => t.id), [1]);
});

check("searchTasks: разный регистр", () => {
  const result = searchTasks(demoTasks, "ФУНКЦИИ");
  assert.deepEqual(result.map((t) => t.id), [1]);
});

check("searchTasks: краевые пробелы", () => {
  const result = searchTasks(demoTasks, "  ФУНК  ");
  assert.deepEqual(result.map((t) => t.id), [1]);
});

check("searchTasks: нет совпадений", () => {
  assert.deepEqual(searchTasks(demoTasks, "несуществующий фрагмент"), []);
});

check("searchTasks: пустой запрос возвращает все", () => {
  assert.equal(searchTasks(demoTasks, "").length, demoTasks.length);
  assert.equal(searchTasks(demoTasks, "   ").length, demoTasks.length);
});

check("searchTasks: пустой список", () => {
  assert.deepEqual(searchTasks([], "функции"), []);
});

check("searchTasks: исходный массив не изменён", () => {
  const before = snapshot(demoTasks);
  searchTasks(demoTasks, "функции");
  assertNoMutation(demoTasks, before);
});

console.log("");
console.log(`Пройдено: ${passed}; провалено: ${failed}`);

if (failed > 0) {
  process.exitCode = 1;
}
