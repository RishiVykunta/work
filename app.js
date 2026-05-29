const STORAGE_KEY = "letsCookTasks:v1";

const defaultState = {
  name: "",
  tasks: [],
  sessions: [],
  activeSession: null
};

let state = loadState();

const els = {
  introScreen: document.querySelector("#introScreen"),
  dashboard: document.querySelector("#dashboard"),
  nameForm: document.querySelector("#nameForm"),
  nameInput: document.querySelector("#nameInput"),
  greeting: document.querySelector("#greeting"),
  currentTime: document.querySelector("#currentTime"),
  changeNameBtn: document.querySelector("#changeNameBtn"),
  taskForm: document.querySelector("#taskForm"),
  taskTitle: document.querySelector("#taskTitle"),
  taskTime: document.querySelector("#taskTime"),
  taskTarget: document.querySelector("#taskTarget"),
  taskList: document.querySelector("#taskList"),
  activeTaskName: document.querySelector("#activeTaskName"),
  activeTaskMeta: document.querySelector("#activeTaskMeta"),
  sessionTimer: document.querySelector("#sessionTimer"),
  stopTimerBtn: document.querySelector("#stopTimerBtn"),
  todayTotal: document.querySelector("#todayTotal"),
  streakCount: document.querySelector("#streakCount"),
  doneCount: document.querySelector("#doneCount"),
  chart: document.querySelector("#chart"),
  weekRange: document.querySelector("#weekRange")
};

function loadState() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatDateKey(date = new Date()) {
  return date.toLocaleDateString("en-CA");
}

function formatClock(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(ms) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function formatMinutes(ms) {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function createId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function titleCaseName(name) {
  return name.trim().replace(/\s+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function showDashboard() {
  els.introScreen.classList.add("hidden");
  els.dashboard.classList.remove("hidden");
}

function showIntro() {
  els.dashboard.classList.add("hidden");
  els.introScreen.classList.remove("hidden");
  els.nameInput.value = state.name;
  els.nameInput.focus();
}

function render() {
  if (!state.name) {
    showIntro();
  } else {
    showDashboard();
  }

  els.greeting.textContent = `Come on, let's cook ${state.name}`;
  els.currentTime.textContent = formatClock();
  renderActiveSession();
  renderTasks();
  renderStats();
  renderChart();
}

function renderActiveSession() {
  if (!state.activeSession) {
    els.activeTaskName.textContent = "Pick a task to start cooking.";
    els.activeTaskMeta.textContent = "Your timer keeps counting even when you switch tabs.";
    els.sessionTimer.textContent = "00:00:00";
    els.stopTimerBtn.disabled = true;
    document.title = "Let's Cook Tasks";
    return;
  }

  const task = state.tasks.find((item) => item.id === state.activeSession.taskId);
  const elapsed = Date.now() - state.activeSession.startedAt;
  els.activeTaskName.textContent = task ? task.title : "Focused work";
  els.activeTaskMeta.textContent = `Started at ${new Date(state.activeSession.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  els.sessionTimer.textContent = formatDuration(elapsed);
  els.stopTimerBtn.disabled = false;
  document.title = `${formatDuration(elapsed)} - ${task ? task.title : "Working"}`;
}

function renderTasks() {
  const today = formatDateKey();
  const tasks = state.tasks
    .filter((task) => task.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  if (!tasks.length) {
    els.taskList.innerHTML = `<div class="empty-state">Add your first task for today and start the timer.</div>`;
    return;
  }

  els.taskList.innerHTML = tasks.map((task) => {
    const workedMs = totalForTask(task.id);
    const isActive = state.activeSession?.taskId === task.id;
    return `
      <article class="task-item ${task.done ? "done" : ""}">
        <div class="task-main">
          <strong>${escapeHtml(task.title)}</strong>
          <span>${task.time} - target ${task.targetMinutes}m - worked ${formatMinutes(workedMs)}${isActive ? " - cooking now" : ""}</span>
        </div>
        <div class="task-actions">
          <button class="start-btn" data-action="start" data-id="${task.id}" ${isActive ? "disabled" : ""}>Start</button>
          <button class="done-btn" data-action="done" data-id="${task.id}">${task.done ? "Undo" : "Done"}</button>
          <button class="delete-btn" data-action="delete" data-id="${task.id}">Delete</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderStats() {
  const today = formatDateKey();
  const todayMs = totalForDate(today);
  const doneToday = state.tasks.filter((task) => task.date === today && task.done).length;
  els.todayTotal.textContent = formatMinutes(todayMs);
  els.streakCount.textContent = `${calculateStreak()} days`;
  els.doneCount.textContent = doneToday;
}

function renderChart() {
  const days = lastSevenDays();
  const maxMs = Math.max(...days.map((day) => totalForDate(day.key)), 30 * 60000);
  els.weekRange.textContent = `${days[0].shortDate} - ${days[days.length - 1].shortDate}`;
  els.chart.innerHTML = days.map((day) => {
    const total = totalForDate(day.key);
    const height = Math.max(4, Math.round((total / maxMs) * 100));
    return `
      <div class="bar-wrap">
        <div class="bar-track">
          <div class="bar" style="height:${height}%"></div>
        </div>
        <div class="bar-value">${formatMinutes(total)}</div>
        <div class="bar-day">${day.label}</div>
      </div>
    `;
  }).join("");
}

function totalForTask(taskId) {
  return state.sessions
    .filter((session) => session.taskId === taskId)
    .reduce((sum, session) => sum + session.durationMs, 0);
}

function totalForDate(dateKey) {
  const completed = state.sessions
    .filter((session) => session.date === dateKey)
    .reduce((sum, session) => sum + session.durationMs, 0);

  if (state.activeSession && formatDateKey(new Date(state.activeSession.startedAt)) === dateKey) {
    return completed + (Date.now() - state.activeSession.startedAt);
  }

  return completed;
}

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      key: formatDateKey(date),
      label: date.toLocaleDateString([], { weekday: "short" }),
      shortDate: date.toLocaleDateString([], { month: "short", day: "numeric" })
    };
  });
}

function calculateStreak() {
  let streak = 0;
  const cursor = new Date();

  for (let index = 0; index < 365; index += 1) {
    const key = formatDateKey(cursor);
    if (totalForDate(key) <= 0) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function startTask(taskId) {
  if (state.activeSession) stopActiveSession();
  state.activeSession = {
    taskId,
    startedAt: Date.now()
  };
  saveState();
  render();
}

function stopActiveSession() {
  if (!state.activeSession) return;
  const now = Date.now();
  const durationMs = now - state.activeSession.startedAt;

  if (durationMs > 1000) {
    state.sessions.push({
      id: createId(),
      taskId: state.activeSession.taskId,
      date: formatDateKey(new Date(state.activeSession.startedAt)),
      startedAt: state.activeSession.startedAt,
      endedAt: now,
      durationMs
    });
  }

  state.activeSession = null;
  saveState();
  render();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

els.nameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.name = titleCaseName(els.nameInput.value);
  saveState();
  render();
});

els.changeNameBtn.addEventListener("click", showIntro);

els.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = els.taskTitle.value.trim();
  if (!title) return;

  state.tasks.push({
    id: createId(),
    title,
    time: els.taskTime.value,
    targetMinutes: Number(els.taskTarget.value),
    done: false,
    date: formatDateKey()
  });

  els.taskForm.reset();
  els.taskTarget.value = 30;
  saveState();
  render();
});

els.taskList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const taskId = button.dataset.id;
  const action = button.dataset.action;

  if (action === "start") {
    startTask(taskId);
  }

  if (action === "done") {
    const task = state.tasks.find((item) => item.id === taskId);
    if (task) task.done = !task.done;
    saveState();
    render();
  }

  if (action === "delete") {
    if (state.activeSession?.taskId === taskId) stopActiveSession();
    state.tasks = state.tasks.filter((task) => task.id !== taskId);
    saveState();
    render();
  }
});

els.stopTimerBtn.addEventListener("click", stopActiveSession);

window.addEventListener("storage", () => {
  state = loadState();
  render();
});

setInterval(render, 1000);
render();
