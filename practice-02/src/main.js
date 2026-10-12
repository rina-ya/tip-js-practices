import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
findTaskById,
getPendingTasks,
getTaskTitles,
getTaskStats,
addTask,
setTaskCompleted,
renameTask,
removeTask,
} from "./task-service.js";

function showTasks(title, tasks) {
console.log(`\n${title}`);
console.log(tasks);
}

function showStats(title, tasks) {
const stats = getTaskStats(tasks);
console.log(`\n${title}`);
console.log(
`Всего: ${stats.total}, выполнено: ${stats.completed}, ` +
`ожидают: ${stats.pending}, прогресс: ${stats.progress.toFixed(1)}%`
);
}

console.log("=== Общий сценарий ===");

const originalTasks = [...demoTasks];

showTasks("Исходные задачи:", demoTasks);
showStats("Начальная статистика:", demoTasks);
console.log("Названия:", getTaskTitles(demoTasks));
console.log("Ожидают выполнения:", getPendingTasks(demoTasks));
console.log("Задача с ID 4:", findTaskById(demoTasks, 4));

let result = addTask(demoTasks, 20, "Добавить проверку", "high");
if (result.ok) {
let tasks = result.tasks;
showTasks("После добавления задачи:", tasks);
showStats("Статистика после добавления:", tasks);

result = setTaskCompleted(tasks, 4, true);
if (result.ok) {
tasks = result.tasks;
showStats("После выполнения задачи 4:", tasks);
}

result = renameTask(tasks, 10, "Подготовить инструкцию запуска");
if (result.ok) {
tasks = result.tasks;
showTasks("После переименования:", tasks);
showStats("После переименования:", tasks);
}

result = removeTask(tasks, 7);
if (result.ok) {
tasks = result.tasks;
showTasks("После удаления задачи 7:", tasks);
showStats("Итоговая статистика:", tasks);
}

console.log("\nПопытка добавить повторяющийся ID:");
console.log(addTask(tasks, 20, "Дубликат", "low"));

console.log("\nФинальные ID:", tasks.map((task) => task.id));
console.log("Ожидают выполнения:", getPendingTasks(tasks));
}

console.log("\nИсходный массив не изменился:",
JSON.stringify(demoTasks) === JSON.stringify(originalTasks)
);

console.log(`\n=== Индивидуальный вариант ${variantNumber} ===`);
showTasks("Исходные задачи варианта:", variantTasks);

let personal = addTask(
variantTasks,
80,
"Подготовка учебного проекта",
"high"
);

if (personal.ok) {
let tasks = personal.tasks;

result = setTaskCompleted(tasks, 11, true);
if (result.ok) tasks = result.tasks;

result = renameTask(tasks, 23, "Обновить план учебного проекта");
if (result.ok) tasks = result.tasks;

result = removeTask(tasks, 37);
if (result.ok) tasks = result.tasks;

console.log("Итоговые задачи варианта:", tasks);
console.log("Попытка добавить ID 80 повторно:",
addTask(tasks, 80, "Повтор", "high")
);
showStats("Статистика варианта:", tasks);
}

console.log("\nИсходные задачи варианта не изменились:",
JSON.stringify(variantTasks) ===
JSON.stringify(variantTasks.map((task) => ({ ...task })))
);
