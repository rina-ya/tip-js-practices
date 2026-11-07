const PRIORITY_LABELS = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

export function createTaskElement(task, category) {
  const li = document.createElement("li");
  li.className = "task-card";
  li.dataset.taskId = String(task.id);
  if (task.completed) {
    li.classList.add("is-completed");
  }

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;
  li.append(title);

  const status = document.createElement("span");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнена" : "В работе";
  li.append(status);

  const priority = document.createElement("span");
  priority.className = "task-priority";
  priority.textContent = PRIORITY_LABELS[task.priority] ?? task.priority;
  li.append(priority);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.dataset.action = "toggle";
  toggle.setAttribute("aria-pressed", String(task.completed));
  const toggleLabel = document.createElement("span");
  toggleLabel.className = "action-label";
  toggleLabel.textContent = "Выполнена";
  toggle.append(toggleLabel);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.dataset.action = "delete";
  const removeLabel = document.createElement("span");
  removeLabel.className = "action-label";
  removeLabel.textContent = "Удалить";
  remove.append(removeLabel);

  const edit = document.createElement("button");
  edit.type = "button";
  edit.dataset.action = "edit";
  const editLabel = document.createElement("span");
  editLabel.className = "action-label";
  editLabel.textContent = "Изменить";
  edit.append(editLabel);
  actions.append(toggle, edit, remove);
  li.append(actions);

  const categoryLabel = document.createElement("span");
  categoryLabel.className = "task-category";
  categoryLabel.textContent = category?.name ?? "Неизвестная категория";
  const metadata = document.createElement("div");
  metadata.className = "task-meta";
  const identifier = document.createElement("span");
  identifier.className = "task-id";
  identifier.textContent = `№ ${task.id}`;
  metadata.append(identifier, status, priority, categoryLabel);
  li.insertBefore(metadata, actions);
  return li;
}


export function renderTaskList(list, tasks, categories) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  list.replaceChildren(...tasks.map((task) => createTaskElement(task, byId.get(task.categoryId))));
}
