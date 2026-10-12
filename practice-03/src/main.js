//Гиниятова АИ
import { demoTasks, variantTasks } from "./data.js";
import {
  findTaskById,
  setTaskCompleted,
  removeTask,
} from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import {
  renderTaskList,
  renderSummary,
  renderEmptyState,
} from "./task-view.js";
import {
  createUndoState,
  rememberRemoved,
  clearUndoState,
  restoreRemoved,
} from "./task-extra.js";

const listElement = document.querySelector("#task-list");
const summaryElement = document.querySelector("#task-summary");
const emptyMessage = document.querySelector("#empty-message");
const operationMessage = document.querySelector("#operation-message");
const filtersElement = document.querySelector("#task-filters");
const datasetLabel = document.querySelector("#dataset-label");
const undoButton = document.querySelector("#undo-button");

const useVariant = new URLSearchParams(location.search).get("dataset") === "variant";
const initialTasks = useVariant ? variantTasks : demoTasks;
datasetLabel.textContent = useVariant ? "Набор: свой вариант" : "Набор: общий";

let currentTasks = initialTasks.map((task) => ({ ...task }));
let currentFilter = "all";
let undoState = createUndoState();

function renderApp() {
  const visibleTasks = getVisibleTasks(currentTasks, currentFilter);
  renderTaskList(listElement, visibleTasks);
  renderSummary(summaryElement, currentTasks, visibleTasks.length);
  renderEmptyState(emptyMessage, currentTasks.length, visibleTasks.length);

  for (const button of filtersElement.querySelectorAll("button[data-filter]")) {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }

  undoButton.disabled = undoState.task === null;
}

function clearOperationMessage() {
  operationMessage.textContent = "";
}

function showOperationMessage(text) {
  operationMessage.textContent = text;
}

function restoreTaskFocus(id, action) {
  const card = listElement.querySelector(`[data-task-id="${id}"]`);
  if (card) {
    const button = card.querySelector(`[data-action="${action}"]`);
    if (button) {
      button.focus();
      return;
    }
  }
  const activeFilter = filtersElement.querySelector(`button[data-filter="${currentFilter}"]`);
  if (activeFilter) {
    activeFilter.focus();
  }
}

export function handleTaskListClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-action]");
  if (!button || !listElement.contains(button)) return;

  const action = button.dataset.action;
  if (action !== "toggle" && action !== "delete") return;

  const card = button.closest("li[data-task-id]");
  if (!card) return;

  const id = Number(card.dataset.taskId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    showOperationMessage("Некорректный идентификатор задачи.");
    return;
  }

  const task = findTaskById(currentTasks, id);
  if (!task) {
    showOperationMessage("Задача не найдена.");
    return;
  }

  let result;
  if (action === "toggle") {
    result = setTaskCompleted(currentTasks, id, !task.completed);
  } else {
    const index = currentTasks.findIndex((item) => item.id === id);
    result = removeTask(currentTasks, id);
    if (result.ok) {
      undoState = rememberRemoved(undoState, task, index);
    }
  }

  if (!result.ok) {
    showOperationMessage(result.error);
    return;
  }

  currentTasks = result.tasks;
  clearOperationMessage();
  renderApp();
  restoreTaskFocus(id, action);
}

export function handleFilterClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-filter]");
  if (!button || !filtersElement.contains(button)) return;

  const filter = button.dataset.filter;
  if (filter !== "all" && filter !== "pending" && filter !== "completed") return;

  currentFilter = filter;
  clearOperationMessage();
  renderApp();
}

function handleUndoClick() {
  if (!undoState.task) return;

  const restoredTask = undoState.task;

  const result = restoreRemoved(currentTasks, undoState);
  if (!result.ok) {
    showOperationMessage(result.error);
    return;
  }

  currentTasks = result.tasks;
  undoState = clearUndoState();
  clearOperationMessage();
  renderApp();

  restoreTaskFocus(restoredTask.id, "toggle");
}

listElement.addEventListener("click", handleTaskListClick);
filtersElement.addEventListener("click", handleFilterClick);
undoButton.addEventListener("click", handleUndoClick);

renderApp();