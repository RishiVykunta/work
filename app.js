const STORAGE_PREFIX = "letsCookTasks:user:";
const USERS_KEY = "letsCookTasks:users:v1";
const CURRENT_USER_KEY = "letsCookTasks:currentUser";
const DEFAULT_TARGET_DAYS = 217;
const DEFAULT_DAILY_HOURS = 4;

const defaultState = {
  name: "",
  aim: "",
  targetDays: DEFAULT_TARGET_DAYS,
  dailyHours: DEFAULT_DAILY_HOURS,
  prepStartDate: "",
  goalDate: "",
  setupComplete: false,
  tasks: [],
  sessions: [],
  activeSession: null
};

let currentUser = localStorage.getItem(CURRENT_USER_KEY) || "";
let state = loadState();
let editingName = false;

const els = {
  authScreen: document.querySelector("#authScreen"),
  authForm: document.querySelector("#authForm"),
  usernameInput: document.querySelector("#usernameInput"),
  passwordInput: document.querySelector("#passwordInput"),
  authMessage: document.querySelector("#authMessage"),
  introScreen: document.querySelector("#introScreen"),
  dashboard: document.querySelector("#dashboard"),
  nameForm: document.querySelector("#nameForm"),
  nameInput: document.querySelector("#nameInput"),
  aimInput: document.querySelector("#aimInput"),
  targetDaysInput: document.querySelector("#targetDaysInput"),
  dailyHoursInput: document.querySelector("#dailyHoursInput"),
  greeting: document.querySelector("#greeting"),
  aimLine: document.querySelector("#aimLine"),
  currentTime: document.querySelector("#currentTime"),
  daysLeft: document.querySelector("#daysLeft"),
  goalProgress: document.querySelector("#goalProgress"),
  targetLabel: document.querySelector("#targetLabel"),
  streakGoalText: document.querySelector("#streakGoalText"),
  changeNameBtn: document.querySelector("#changeNameBtn"),
  logoutBtn: document.querySelector("#logoutBtn"),
  taskForm: document.querySelector("#taskForm"),
  taskTitle: document.querySelector("#taskTitle"),
  taskTime: document.querySelector("#taskTime"),
  taskTarget: document.querySelector("#taskTarget"),
  taskList: document.querySelector("#taskList"),
  miniTimer: document.querySelector("#miniTimer"),
  miniTimeLeft: document.querySelector("#miniTimeLeft"),
  miniTaskName: document.querySelector("#miniTaskName"),
  miniProgressFill: document.querySelector("#miniProgressFill"),
  minusFiveBtn: document.querySelector("#minusFiveBtn"),
  activeTargetMinutes: document.querySelector("#activeTargetMinutes"),
  plusFiveBtn: document.querySelector("#plusFiveBtn"),
  completionModal: document.querySelector("#completionModal"),
  completionMessage: document.querySelector("#completionMessage"),
  finishSessionBtn: document.querySelector("#finishSessionBtn"),
  continueSessionBtn: document.querySelector("#continueSessionBtn"),
  activeTaskName: document.querySelector("#activeTaskName"),
  activeTaskMeta: document.querySelector("#activeTaskMeta"),
  sessionTimer: document.querySelector("#sessionTimer"),
  sessionTimeLeft: document.querySelector("#sessionTimeLeft"),
  stopTimerBtn: document.querySelector("#stopTimerBtn"),
  todayTotal: document.querySelector("#todayTotal"),
  streakCount: document.querySelector("#streakCount"),
  bestStreakCount: document.querySelector("#bestStreakCount"),
  doneCount: document.querySelector("#doneCount"),
  dailyGoal: document.querySelector("#dailyGoal"),
  yAxis: document.querySelector("#yAxis"),
  chart: document.querySelector("#chart"),
  xAxis: document.querySelector("#xAxis"),
  weekRange: document.querySelector("#weekRange")
};

function loadState() {
  if (!currentUser) return { ...defaultState };

  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(userStorageKey(currentUser))) };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  if (!currentUser) return;
  localStorage.setItem(userStorageKey(currentUser), JSON.stringify(state));
}

function userStorageKey(username) {
  return `${STORAGE_PREFIX}${username.toLowerCase()}`;
}

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
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

function formatTimeLeft(ms) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.ceil(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mainParts = hours > 0 ? [hours, minutes, seconds] : [minutes, seconds];
  return mainParts.map((part) => String(part).padStart(2, "0")).join(":");
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function titleCaseName(name) {
  return name.trim().replace(/\s+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function hideAllScreens() {
  els.authScreen.classList.add("hidden");
  els.introScreen.classList.add("hidden");
  els.dashboard.classList.add("hidden");
}

function showAuth(message = "") {
  hideAllScreens();
  els.authScreen.classList.remove("hidden");
  els.authMessage.textContent = message;
}

function showDashboard() {
  hideAllScreens();
  els.dashboard.classList.remove("hidden");
}

function showIntro(prefill = false) {
  hideAllScreens();
  els.introScreen.classList.remove("hidden");
  if (prefill) {
    els.nameInput.value = state.name;
    els.aimInput.value = state.aim;
    els.targetDaysInput.value = state.targetDays || DEFAULT_TARGET_DAYS;
    els.dailyHoursInput.value = state.dailyHours || DEFAULT_DAILY_HOURS;
  }
  els.nameInput.focus();
}

function render() {
  if (!currentUser) {
    if (els.authScreen.classList.contains("hidden")) showAuth();
    return;
  }

  if (!state.setupComplete || editingName) {
    if (els.introScreen.classList.contains("hidden")) showIntro(true);
    return;
  } else {
    showDashboard();
  }

  els.greeting.textContent = `Come on, let's cook ${state.name}`;
  els.aimLine.textContent = state.aim ? `Aim: ${state.aim}` : "";
  els.currentTime.textContent = formatClock();
  renderCountdown();
  renderActiveSession();
  renderTasks();
  renderStats();
  renderChart();
}

function renderCountdown() {
  const now = new Date();
  const goalDate = getGoalDate();
  const prepStartDate = getPrepStartDate();
  const msLeft = goalDate.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(msLeft / 86400000));
  const totalPrepMs = Math.max(1, goalDate.getTime() - prepStartDate.getTime());
  const elapsedPrepMs = now.getTime() - prepStartDate.getTime();
  const progress = Math.min(100, Math.max(0, (elapsedPrepMs / totalPrepMs) * 100));
  els.daysLeft.textContent = daysLeft;
  els.goalProgress.style.width = `${progress}%`;
  els.targetLabel.textContent = `${state.targetDays || DEFAULT_TARGET_DAYS}-day target`;
  els.streakGoalText.textContent = `Build the ${state.targetDays || DEFAULT_TARGET_DAYS}-day study streak`;
}

function renderActiveSession() {
  if (!state.activeSession) {
    els.activeTaskName.textContent = "Choose a study task below.";
    els.activeTaskMeta.textContent = "When you press Start, the timer keeps counting even if you switch tabs.";
    els.sessionTimer.textContent = "00:00:00";
    els.sessionTimeLeft.textContent = "Time left 00:00";
    els.miniTimer.classList.add("hidden");
    els.completionModal.classList.add("hidden");
    els.stopTimerBtn.disabled = true;
    els.stopTimerBtn.classList.add("hidden");
    document.title = "Study Focus Tasks";
    return;
  }

  const task = state.tasks.find((item) => item.id === state.activeSession.taskId);
  const elapsed = Date.now() - state.activeSession.startedAt;
  const targetMinutes = getActiveTargetMinutes(task);
  const targetMs = targetMinutes * 60000;
  const timeLeft = targetMs - elapsed;
  const progress = Math.min(100, Math.max(0, (elapsed / targetMs) * 100));
  const leftLabel = timeLeft > 0 ? formatTimeLeft(timeLeft) : `+${formatTimeLeft(Math.abs(timeLeft))}`;

  els.activeTaskName.textContent = task ? task.title : "Focused work";
  els.activeTaskMeta.textContent = `Started at ${new Date(state.activeSession.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - target ${targetMinutes} minutes`;
  els.sessionTimer.textContent = formatDuration(elapsed);
  els.sessionTimeLeft.textContent = timeLeft > 0 ? `Time left ${leftLabel}` : `Overtime ${leftLabel}`;
  els.miniTimer.classList.remove("hidden");
  els.miniTimeLeft.textContent = leftLabel;
  els.miniTaskName.textContent = task ? task.title : "Focused work";
  els.miniProgressFill.style.width = `${progress}%`;
  els.activeTargetMinutes.textContent = `${targetMinutes}m`;
  if (timeLeft <= 0 && !state.activeSession.completedAlertShown) {
    state.activeSession.completedAlertShown = true;
    saveState();
    showCompletionMessage(task, targetMinutes);
  }
  els.stopTimerBtn.disabled = false;
  els.stopTimerBtn.classList.remove("hidden");
  document.title = `${leftLabel} left - ${task ? task.title : "Working"}`;
}

function showCompletionMessage(task, targetMinutes) {
  const taskName = task ? task.title : "your study task";
  const aimText = state.aim ? state.aim : "your goal";
  els.completionMessage.textContent = `Excellent work. You finished ${targetMinutes} focused minutes for "${taskName}". That is one more honest step toward ${aimText}.`;
  els.completionModal.classList.remove("hidden");
}

function getActiveTargetMinutes(task) {
  return Math.max(5, Number(state.activeSession?.targetMinutes || task?.targetMinutes || 30));
}

function renderTasks() {
  const today = formatDateKey();
  const tasks = state.tasks
    .filter((task) => task.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  if (!tasks.length) {
    els.taskList.innerHTML = `<div class="empty-state">Add your first study task for today and start the timer.</div>`;
    return;
  }

  els.taskList.innerHTML = tasks.map((task) => {
    const workedMs = totalForTask(task.id);
    const isActive = state.activeSession?.taskId === task.id;
    return `
      <article class="task-item ${task.done ? "done" : ""}">
        <div class="task-main">
          <strong>${escapeHtml(task.title)}</strong>
          <span>${task.time} - target ${task.targetMinutes}m - studied ${formatMinutes(workedMs)}${isActive ? " - focusing now" : ""}</span>
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
  els.bestStreakCount.textContent = `${calculateBestStreak()} days`;
  els.doneCount.textContent = doneToday;
  els.dailyGoal.textContent = `${Number(state.dailyHours || DEFAULT_DAILY_HOURS)}h`;
}

function renderChart() {
  const days = preparationDays();
  const maxHours = Math.max(1, Math.ceil(Math.max(...days.map((day) => totalForDate(day.key))) / 3600000));
  els.weekRange.textContent = `Day 1 - Day ${days.length}`;
  els.yAxis.innerHTML = Array.from({ length: maxHours + 1 }, (_, index) => {
    const hour = maxHours - index;
    return `<span>${hour}h</span>`;
  }).join("");
  els.chart.innerHTML = days.map((day) => {
    const total = totalForDate(day.key);
    const hours = total / 3600000;
    const height = Math.max(2, Math.round((hours / maxHours) * 100));
    return `
      <div class="bar-wrap" title="${day.label}: ${formatMinutes(total)}">
        <div class="bar" style="height:${height}%"></div>
      </div>
    `;
  }).join("");
  els.xAxis.innerHTML = days.map((day) => `<span>${day.dayNumber}</span>`).join("");
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

function preparationDays() {
  const start = getPrepStartDate();
  const today = new Date();
  const goalDate = getGoalDate();
  const end = today < goalDate ? today : goalDate;
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const dayCount = Math.max(1, Math.floor((end - start) / 86400000) + 1);

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: formatDateKey(date),
      dayNumber: index + 1,
      label: `Day ${index + 1} - ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`
    };
  });
}

function getPrepStartDate() {
  const start = state.prepStartDate ? new Date(state.prepStartDate) : new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

function getGoalDate() {
  if (state.goalDate) return new Date(state.goalDate);
  const fallback = getPrepStartDate();
  fallback.setDate(fallback.getDate() + Number(state.targetDays || DEFAULT_TARGET_DAYS));
  return fallback;
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

function calculateBestStreak() {
  const activeDates = new Set(state.sessions.map((session) => session.date));

  if (state.activeSession) {
    activeDates.add(formatDateKey(new Date(state.activeSession.startedAt)));
  }

  if (!activeDates.size) return 0;

  const sortedDates = [...activeDates].sort();
  let best = 1;
  let current = 1;

  for (let index = 1; index < sortedDates.length; index += 1) {
    const previous = new Date(`${sortedDates[index - 1]}T00:00:00`);
    const currentDate = new Date(`${sortedDates[index]}T00:00:00`);
    const dayGap = Math.round((currentDate - previous) / 86400000);

    if (dayGap === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

function startTask(taskId) {
  if (state.activeSession) stopActiveSession();
  const task = state.tasks.find((item) => item.id === taskId);
  state.activeSession = {
    taskId,
    startedAt: Date.now(),
    targetMinutes: Number(task?.targetMinutes || 30),
    completedAlertShown: false
  };
  saveState();
  render();
}

function adjustActiveTarget(deltaMinutes) {
  if (!state.activeSession) return;
  const task = state.tasks.find((item) => item.id === state.activeSession.taskId);
  const nextTarget = Math.max(5, getActiveTargetMinutes(task) + deltaMinutes);
  state.activeSession.targetMinutes = nextTarget;
  if (task) task.targetMinutes = nextTarget;
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
  state.aim = els.aimInput.value.trim();
  state.targetDays = Math.max(1, Number(els.targetDaysInput.value || DEFAULT_TARGET_DAYS));
  state.dailyHours = Math.max(1, Number(els.dailyHoursInput.value || DEFAULT_DAILY_HOURS));
  if (!state.prepStartDate || !state.setupComplete) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    state.prepStartDate = start.toISOString();
  }
  const goal = getPrepStartDate();
  goal.setDate(goal.getDate() + state.targetDays);
  state.goalDate = goal.toISOString();
  state.setupComplete = true;
  editingName = false;
  saveState();
  render();
});

els.changeNameBtn.addEventListener("click", () => {
  editingName = true;
  showIntro(true);
});

els.logoutBtn.addEventListener("click", () => {
  if (state.activeSession) stopActiveSession();
  currentUser = "";
  localStorage.removeItem(CURRENT_USER_KEY);
  state = { ...defaultState };
  editingName = false;
  showAuth("Logged out. Login again to continue.");
});

els.authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const submitter = event.submitter;
  const action = submitter?.dataset.authAction || "login";
  const username = els.usernameInput.value.trim().toLowerCase();
  const password = els.passwordInput.value;
  const users = loadUsers();

  if (!username || !password) {
    showAuth("Enter a username and password.");
    return;
  }

  if (action === "register") {
    if (users[username]) {
      showAuth("That username already exists. Login instead.");
      return;
    }
    users[username] = { password };
    saveUsers(users);
  } else if (!users[username] || users[username].password !== password) {
    showAuth("Username or password is wrong.");
    return;
  }

  currentUser = username;
  localStorage.setItem(CURRENT_USER_KEY, currentUser);
  state = loadState();
  editingName = false;
  els.passwordInput.value = "";
  render();
});

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
els.minusFiveBtn.addEventListener("click", () => adjustActiveTarget(-5));
els.plusFiveBtn.addEventListener("click", () => adjustActiveTarget(5));
els.finishSessionBtn.addEventListener("click", stopActiveSession);
els.continueSessionBtn.addEventListener("click", () => {
  els.completionModal.classList.add("hidden");
});

window.addEventListener("storage", () => {
  state = loadState();
  render();
});

setInterval(render, 1000);
render();
