function isValidId(id) {
return Number.isSafeInteger(id) && id > 0;
}

function isValidTitle(title) {
return (
typeof title === "string" &&
title.trim().length >= 1 &&
title.trim().length <= 100
);
}

function isValidPriority(priority) {
return ["low", "medium", "high"].includes(priority);
}

export function createTask(id, title, priority = "medium") {
if (!isValidId(id)) {
return { ok: false, error: "ID должен быть положительным безопасным целым числом" };
}

if (!isValidTitle(title)) {
return { ok: false, error: "Название должно содержать от 1 до 100 символов" };
}

if (!isValidPriority(priority)) {
return { ok: false, error: "Приоритет должен быть low, medium или high" };
}

const task = {
id,
title: title.trim(),
completed: false,
priority,
};

return { ok: true, task };
}

export function findTaskById(tasks, id) {
return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
return tasks.map(({ title }) => title);
}

export function getTaskStats(tasks) {
const total = tasks.length;
const completed = tasks.filter((task) => task.completed === true).length;
const pending = total - completed;
const progress = total === 0 ? 0 : (completed / total) * 100;

return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
if (!isValidId(id)) {
return { ok: false, error: "Некорректный ID" };
}

if (tasks.some((task) => task.id === id)) {
return { ok: false, error: "Задача с таким ID уже существует" };
}

const result = createTask(id, title, priority);

if (!result.ok) {
return result;
}

return { ok: true, tasks: [...tasks, result.task] };
}

export function setTaskCompleted(tasks, id, completed) {
if (!isValidId(id)) {
return { ok: false, error: "Некорректный ID" };
}

if (typeof completed !== "boolean") {
return { ok: false, error: "Статус должен быть true или false" };
}

if (!tasks.some((task) => task.id === id)) {
return { ok: false, error: "Задача не найдена" };
}

const updatedTasks = tasks.map((task) =>
task.id === id ? { ...task, completed } : task
);

return { ok: true, tasks: updatedTasks };
}

export function renameTask(tasks, id, newTitle) {
if (!isValidId(id)) {
return { ok: false, error: "Некорректный ID" };
}

if (!isValidTitle(newTitle)) {
return { ok: false, error: "Название должно содержать от 1 до 100 символов" };
}

if (!tasks.some((task) => task.id === id)) {
return { ok: false, error: "Задача не найдена" };
}

const updatedTasks = tasks.map((task) =>
task.id === id ? { ...task, title: newTitle.trim() } : task
);

return { ok: true, tasks: updatedTasks };
}

export function removeTask(tasks, id) {
if (!isValidId(id)) {
return { ok: false, error: "Некорректный ID" };
}

if (!tasks.some((task) => task.id === id)) {
return { ok: false, error: "Задача не найдена" };
}

return {
ok: true,
tasks: tasks.filter((task) => task.id !== id),
};
}
