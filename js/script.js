/* Life Dashboard — script.js
   Vanilla JS + LocalStorage */

// Storage Helpers 

const store = {
  get: (key, fallback = null) => {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

// Theme 

const themeToggleBtn = document.getElementById('theme-toggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeToggleBtn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

function initTheme() {
  const saved = store.get('theme', 'light');
  applyTheme(saved);
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  store.set('theme', next);
  applyTheme(next);
});

// Username & Greeting 

const usernameModal   = document.getElementById('username-modal');
const usernameInput   = document.getElementById('username-input');
const usernameSaveBtn = document.getElementById('username-save-btn');
const editNameBtn     = document.getElementById('edit-name-btn');
const greetingEl      = document.getElementById('greeting');

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function updateGreeting() {
  const name = store.get('username', '');
  const base = getGreeting();
  greetingEl.textContent = name ? `${base}, ${name}! 👋` : `${base}! 👋`;
}

function showUsernameModal() {
  const current = store.get('username', '');
  usernameInput.value = current;
  usernameModal.classList.remove('hidden');
  setTimeout(() => usernameInput.focus(), 50);
}

function saveUsername() {
  const name = usernameInput.value.trim();
  store.set('username', name);
  usernameModal.classList.add('hidden');
  updateGreeting();
}

usernameSaveBtn.addEventListener('click', saveUsername);
usernameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveUsername();
});
editNameBtn.addEventListener('click', showUsernameModal);

function initUsername() {
  const name = store.get('username', null);
  if (name === null) {
    showUsernameModal();
  }
  updateGreeting();
}

// Date & Time 

const datetimeEl = document.getElementById('datetime');

function updateDatetime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  datetimeEl.textContent = `${timeStr} · ${dateStr}`;
  updateGreeting(); // refresh greeting in case midnight passes
}

// Pomodoro Timer 

const pomodoroTimeEl   = document.getElementById('pomodoro-time');
const pomodoroStartBtn = document.getElementById('pomodoro-start');
const pomodoroResetBtn = document.getElementById('pomodoro-reset');
const pomodoroStatusEl = document.getElementById('pomodoro-status');
const modeBtns         = document.querySelectorAll('.mode-btn');

let pomodoroInterval  = null;
let pomodoroSeconds   = 25 * 60;
let pomodoroRunning   = false;
let pomodoroTotalSecs = 25 * 60;

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderPomodoroTime() {
  pomodoroTimeEl.textContent = formatTime(pomodoroSeconds);
  // Update page title while running
  if (pomodoroRunning) {
    document.title = `${formatTime(pomodoroSeconds)} — Life Dashboard`;
  } else {
    document.title = 'Life Dashboard';
  }
}

function startPomodoro() {
  if (pomodoroRunning) return;
  pomodoroRunning = true;
  pomodoroStartBtn.textContent = 'Pause';
  pomodoroStatusEl.textContent = '🎯 Stay focused!';

  pomodoroInterval = setInterval(() => {
    pomodoroSeconds--;
    renderPomodoroTime();
    if (pomodoroSeconds <= 0) {
      clearInterval(pomodoroInterval);
      pomodoroRunning = false;
      pomodoroStartBtn.textContent = 'Start';
      pomodoroStatusEl.textContent = '✅ Time\'s up! Take a break.';
      document.title = 'Life Dashboard';
      // Simple audio beep via Web Audio API
      playBeep();
    }
  }, 1000);
}

function pausePomodoro() {
  clearInterval(pomodoroInterval);
  pomodoroRunning = false;
  pomodoroStartBtn.textContent = 'Resume';
  pomodoroStatusEl.textContent = '⏸ Paused';
  document.title = 'Life Dashboard';
}

function resetPomodoro() {
  clearInterval(pomodoroInterval);
  pomodoroRunning = false;
  pomodoroSeconds = pomodoroTotalSecs;
  pomodoroStartBtn.textContent = 'Start';
  pomodoroStatusEl.textContent = '';
  renderPomodoroTime();
  document.title = 'Life Dashboard';
}

pomodoroStartBtn.addEventListener('click', () => {
  if (pomodoroRunning) {
    pausePomodoro();
  } else {
    startPomodoro();
  }
});

pomodoroResetBtn.addEventListener('click', resetPomodoro);

modeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    modeBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const minutes = parseInt(btn.dataset.minutes, 10);
    pomodoroTotalSecs = minutes * 60;
    pomodoroSeconds   = pomodoroTotalSecs;
    resetPomodoro();
  });
});

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);
  } catch (_) {
    // Audio not available — silently skip
  }
}

// To-Do List

const todoInput        = document.getElementById('todo-input');
const todoAddBtn       = document.getElementById('todo-add-btn');
const todoListEl       = document.getElementById('todo-list');
const todoErrorEl      = document.getElementById('todo-error');
const todoCountEl      = document.getElementById('todo-count');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const filterBtns       = document.querySelectorAll('.filter-btn');

let currentFilter = 'all';

function getTodos() {
  return store.get('todos', []);
}

function saveTodos(todos) {
  store.set('todos', todos);
}

function isDuplicateTodo(text) {
  const todos = getTodos();
  return todos.some((t) => t.text.toLowerCase() === text.toLowerCase());
}

function addTodo(text) {
  if (!text) return;
  if (isDuplicateTodo(text)) {
    showError(todoErrorEl, 'Task already exists!');
    return;
  }
  const todos = getTodos();
  todos.push({ id: Date.now(), text, completed: false });
  saveTodos(todos);
  renderTodos();
  todoInput.value = '';
}

function toggleTodo(id) {
  const todos = getTodos().map((t) =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  saveTodos(todos);
  renderTodos();
}

function deleteTodo(id) {
  const todos = getTodos().filter((t) => t.id !== id);
  saveTodos(todos);
  renderTodos();
}

function clearCompleted() {
  const todos = getTodos().filter((t) => !t.completed);
  saveTodos(todos);
  renderTodos();
}

function renderTodos() {
  const todos = getTodos();
  const filtered = todos.filter((t) => {
    if (currentFilter === 'active')    return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  todoListEl.innerHTML = '';

  if (filtered.length === 0) {
    todoListEl.innerHTML = `<li class="empty-state">${
      currentFilter === 'completed' ? 'No completed tasks yet.' :
      currentFilter === 'active'    ? 'No active tasks. Great job! 🎉' :
      'No tasks yet. Add one above!'
    }</li>`;
  } else {
    filtered.forEach((todo) => {
      const li = document.createElement('li');
      li.className = `todo-item${todo.completed ? ' completed' : ''}`;
      li.innerHTML = `
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} aria-label="Mark task complete" />
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <button class="todo-delete-btn" aria-label="Delete task">✕</button>
      `;
      li.querySelector('.todo-checkbox').addEventListener('change', () => toggleTodo(todo.id));
      li.querySelector('.todo-delete-btn').addEventListener('click', () => deleteTodo(todo.id));
      todoListEl.appendChild(li);
    });
  }

  // Update count (always based on all todos, not filtered)
  const activeCount = todos.filter((t) => !t.completed).length;
  todoCountEl.textContent = `${activeCount} task${activeCount !== 1 ? 's' : ''} left`;
}

todoAddBtn.addEventListener('click', () => addTodo(todoInput.value.trim()));
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo(todoInput.value.trim());
});
todoInput.addEventListener('input', () => hideError(todoErrorEl));

clearCompletedBtn.addEventListener('click', clearCompleted);

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTodos();
  });
});

// Quick Links

const linkNameInput = document.getElementById('link-name-input');
const linkUrlInput  = document.getElementById('link-url-input');
const linkAddBtn    = document.getElementById('link-add-btn');
const linksListEl   = document.getElementById('links-list');
const linkErrorEl   = document.getElementById('link-error');

function getLinks() {
  return store.get('links', []);
}

function saveLinks(links) {
  store.set('links', links);
}

function isDuplicateLink(url) {
  const links = getLinks();
  return links.some((l) => l.url.toLowerCase() === url.toLowerCase());
}

function normalizeUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

function getFaviconUrl(url) {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return '';
  }
}

function addLink(name, url) {
  if (!url) return;
  const normalizedUrl = normalizeUrl(url);
  const label = name || normalizedUrl;

  if (isDuplicateLink(normalizedUrl)) {
    showError(linkErrorEl, 'Link already exists!');
    return;
  }

  const links = getLinks();
  links.push({ id: Date.now(), name: label, url: normalizedUrl });
  saveLinks(links);
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
}

function deleteLink(id) {
  const links = getLinks().filter((l) => l.id !== id);
  saveLinks(links);
  renderLinks();
}

function renderLinks() {
  const links = getLinks();
  linksListEl.innerHTML = '';

  if (links.length === 0) {
    linksListEl.innerHTML = '<li class="empty-state">No links yet. Add your favourites!</li>';
    return;
  }

  links.forEach((link) => {
    const li = document.createElement('li');
    li.className = 'link-item';
    const favicon = getFaviconUrl(link.url);
    li.innerHTML = `
      ${favicon ? `<img class="link-favicon" src="${favicon}" alt="" onerror="this.style.display='none'" />` : ''}
      <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(link.url)}">${escapeHtml(link.name)}</a>
      <button class="link-delete-btn" aria-label="Delete link">✕</button>
    `;
    li.querySelector('.link-delete-btn').addEventListener('click', () => deleteLink(link.id));
    linksListEl.appendChild(li);
  });
}

linkAddBtn.addEventListener('click', () => addLink(linkNameInput.value.trim(), linkUrlInput.value.trim()));
linkUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addLink(linkNameInput.value.trim(), linkUrlInput.value.trim());
});
linkUrlInput.addEventListener('input', () => hideError(linkErrorEl));

// Utility

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => hideError(el), 3000);
}

function hideError(el) {
  el.classList.add('hidden');
}

// Init

function init() {
  initTheme();
  initUsername();
  updateDatetime();
  setInterval(updateDatetime, 1000);
  renderPomodoroTime();
  renderTodos();
  renderLinks();
}

init();
