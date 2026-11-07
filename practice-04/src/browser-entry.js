// Этот обычный script работает и при открытии HTML двойным щелчком.
(() => {
  if (window.location.protocol !== "file:") return;

  const script = document.currentScript;
  const root = new URL("../", script.src);
  const origin = `http://127.0.0.1:${script.dataset.port}/`;
  const relativePath = window.location.pathname.slice(root.pathname.length);
  const target = new URL(relativePath || "index.html", origin);
  target.search = window.location.search;
  target.hash = window.location.hash;

  document.addEventListener("DOMContentLoaded", () => {
    const message = document.createElement("div");
    message.id = "launch-message";
    message.setAttribute("role", "status");
    Object.assign(message.style, {
      padding: "18px 24px", background: "#fff4d6", color: "#382a12",
      borderBottom: "1px solid #d6b86b", font: "16px/1.5 system-ui",
    });
    const explanation = document.createElement("p");
    explanation.textContent = "HTML открыт как файл. Для работы кнопок запустите start.cmd в папке практики: он запустит сервер и откроет приложение.";
    const link = document.createElement("a");
    link.href = target.href;
    link.textContent = "Открыть страницу на локальном сервере";
    message.append(explanation, link);
    document.body.prepend(message);
    for (const button of document.querySelectorAll("button")) button.disabled = true;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    fetch(new URL("styles.css", origin), {
      mode: "no-cors", cache: "no-store", signal: controller.signal,
    }).then(() => window.location.replace(target.href))
      .catch(() => { /* Инструкция остаётся видимой, если сервер ещё не запущен. */ })
      .finally(() => clearTimeout(timer));
  }, { once: true });
})();
