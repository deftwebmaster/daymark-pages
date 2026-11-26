import { config, shareURL } from './config.js';
import { loadContent } from './core/content.js';
import { formatDate, today } from './core/dates.js';
import { applyPreferences, downloadBackup, openStorage, readBackup } from './core/storage.js';
import { escape, heading, icon } from './core/ui.js';
import { navigation, registry } from './registry.js';
import { renderPrayerResults } from './modules/prayers.js';
import { preferenceField } from './modules/settings.js';

const byId = id => document.getElementById(id);
const main = byId('main');
const dialog = byId('dialog');
const filters = { query: '', category: '', favorites: false };
const app = { content: null, storage: null, page: null, installPrompt: null, update: null, pwaStatus: '', date: today() };
const scheme = matchMedia('(prefers-color-scheme: dark)');
const pending = new WeakSet();
let toastTimer;
let dialogOrigin;
let dialogSubmit;

function context(parts = []) {
  return { parts, registry, filters, content: app.content, state: app.storage.state, installable: Boolean(app.installPrompt) };
}

function route() {
  const hash = location.hash;
  if (!hash || hash === '#/') return 'today';
  return /^#\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\/?$/.test(hash) ? hash.slice(2).replace(/\/$/, '') : '';
}

function navLinks(active, current) {
  return navigation.map(feature => `<a href="#/${feature.id}" ${active === feature.id ?
    `aria-current="${current === feature.id ? 'page' : 'location'}"` : ''}>${icon(feature.icon)}<span>${escape(feature.name)}</span></a>`).join('');
}

function renderChrome(feature, current) {
  const moment = feature?.id === 'moment';
  const brand = `<a class="wordmark" href="#/today" aria-label="${escape(config.name)} by ${escape(config.organization)} · Today">
    <span class="wordmark-icon"><img src="${escape(config.brandMark)}" alt="" width="192" height="192"></span>
    <span><strong>${escape(config.name)}</strong><small>by ${escape(config.organization)}</small></span></a>`;
  byId('sidebar').innerHTML = `${brand}<nav aria-label="Main navigation">${navLinks(feature?.nav, current)}</nav>
    ${moment ? '' : `<a class="side-moment" href="#/moment">${icon('pause')} <span>I Need a Moment</span></a>`}
    <a href="#/privacy" class="side-note">${icon('lock')} <span>Private by design</span></a>`;
  byId('topbar').innerHTML = `${brand}<div class="top-actions">
    ${!moment && feature?.id !== 'today' ? `<a class="icon-button moment-shortcut" href="#/moment" aria-label="I Need a Moment" title="I Need a Moment">${icon('pause')}</a>` : ''}
    ${moment ? '' : `<a class="icon-button" href="#/settings" aria-label="Settings" title="Settings">${icon('settings')}</a>`}</div>`;
  byId('mobile-nav').innerHTML = navLinks(feature?.nav, current);
  byId('footer').innerHTML = moment ? '' : `<a href="#/about" class="footer-credit">
    <img class="organization-seal" src="${escape(config.organizationLogo)}" alt="" width="52" height="52" loading="lazy">
    <span>About ${escape(config.organization)}</span></a>
    <span class="footer-links"><span>${icon('lock')} Your data stays on this device.</span><a href="#/privacy">Privacy</a></span>`;
  document.body.classList.toggle('is-moment', moment);
}

function render({ navigate = false } = {}) {
  if (!app.content || !app.storage) return;
  const current = route();
  const [id, ...parts] = current.split('/');
  const feature = registry.find(item => item.id === id);
  const active = document.activeElement;
  const activeValue = active?.value;
  const activeName = active?.name;
  const activeAction = active?.dataset?.action;
  const show = feature?.render(context(parts)) ?? {
    title: 'Page unavailable',
    html: `${heading({ title: 'This page could not be found', intro: 'Use the navigation to find a prayer, reflection, or recovery resource.' })}
      <a class="button" href="#/today">Back to Today ${icon('arrow')}</a>`,
  };
  const preferenceDetails = [...main.querySelectorAll('details')].map(item => item.open);
  app.page = show;
  main.innerHTML = show.html;
  main.removeAttribute('aria-busy');
  show.mount?.(main, clipboard);
  if (navigate || !byId('sidebar').innerHTML) renderChrome(feature, current);
  document.title = `${show.title} · ${config.name}`;
  renderPrayerResults(context());

  if (navigate) {
    byId('toast').hidden = true;
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  } else {
    main.querySelectorAll('details').forEach((item, index) => { item.open = Boolean(preferenceDetails[index]); });
    if (activeName || activeAction) {
      const replacement = [...main.querySelectorAll('input, select, button')].find(item =>
        activeAction ? item.dataset.action === activeAction :
          item.name === activeName && (item.type !== 'radio' || item.value === activeValue));
      replacement?.focus({ preventScroll: true });
    }
  }
}

function notices() {
  const el = byId('notices');
  const messages = [
    app.storage && !app.storage.persistent ? '<p>Browser storage is unavailable. Changes will last until you close or reload this page.</p>' : '',
    !navigator.onLine ? '<p>You’re offline. Saved recovery resources are available.</p>' : '',
    app.pwaStatus ? `<p>${escape(app.pwaStatus)}</p>` : '',
    app.update ? '<p>An update is ready. <button class="button quiet" data-action="update">Reload to update</button></p>' : '',
  ].join('');
  el.hidden = !messages;
  el.innerHTML = messages;
}

function announce(message) {
  const toast = byId('toast');
  byId('status').textContent = message;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
}

function setPreferences() {
  applyPreferences(app.storage.state.preferences, app.storage.persistent);
  setThemeColor();
}

function setThemeColor() {
  const theme = document.documentElement.dataset.theme;
  const color = theme === 'system' ? (scheme.matches ? 'dark' : 'light') : theme;
  document.querySelector('meta[name="theme-color"]').content = config.themeColor[color];
}
scheme.addEventListener('change', setThemeColor);

function openDialog({ title, body, confirm, cancel = 'Cancel', submit, danger = false, origin = document.activeElement }) {
  dialogOrigin = origin;
  dialogSubmit = submit;
  dialog.innerHTML = `<form>
    <div class="dialog-head"><h2 id="dialog-title">${escape(title)}</h2>
    <button class="icon-button" type="button" data-action="dismiss-dialog" aria-label="Close dialog">${icon('close')}</button></div>
    ${body}
    <p class="form-error" role="alert"></p>
    <div class="actions dialog-actions"><button class="button secondary" type="button" data-action="dismiss-dialog">${escape(cancel)}</button>
    ${confirm ? `<button class="button ${danger ? 'danger' : ''}" type="submit">${escape(confirm)}</button>` : ''}</div>
    </form>`;
  dialog.showModal();
  (dialog.querySelector('[data-initial-focus]') ?? dialog.querySelector('.dialog-actions button')).focus();
}

dialog.addEventListener('close', () => {
  if (dialogOrigin?.isConnected) dialogOrigin.focus();
  else main.focus({ preventScroll: true });
  dialogOrigin = null;
  dialogSubmit = null;
});

dialog.addEventListener('submit', async event => {
  event.preventDefault();
  if (!dialogSubmit || dialog.dataset.busy) return;
  dialog.dataset.busy = 'true';
  dialog.querySelector('.form-error').textContent = '';
  dialog.querySelectorAll('button').forEach(button => { button.disabled = true; });
  try {
    await dialogSubmit(new FormData(event.target));
    dialog.close();
    render();
  } catch (error) {
    dialog.querySelector('.form-error').textContent = error.message || 'This change could not be saved.';
  } finally {
    dialog.removeAttribute('data-busy');
    dialog.querySelectorAll('button').forEach(button => { button.disabled = false; });
  }
});

dialog.addEventListener('cancel', event => {
  if (dialog.dataset.busy) event.preventDefault();
});

function dateField(date, optional = false) {
  const current = today();
  return `<label class="field"><span>Sobriety date</span>
    <input type="date" name="date" value="${escape(date)}" min="0001-01-01" max="${current}" data-initial-focus ${optional ? '' : 'required'}>
    </label><p class="muted">Choose today or an earlier date.${optional ? ' You can leave this blank during setup.' : ''}</p>`;
}

function setup() {
  const { date, preferences } = app.storage.state;
  openDialog({ title: `Set up ${config.name}`, confirm: 'Save preferences', cancel: 'Close',
    body: `<p>Choose how you’d like the app to feel. You can change these settings anytime.</p>
      ${dateField(date, true)}
      ${preferenceField('theme', 'Theme', preferences.theme)}
      ${preferenceField('language', 'Prayer language', preferences.language)}`,
    submit: async data => {
      await app.storage.update({ date: data.get('date') || undefined,
        preferences: { theme: data.get('theme'), language: data.get('language'), onboarding: true } });
      setPreferences();
      announce('Setup saved.');
    } });
}

function editDate() {
  const { date } = app.storage.state;
  openDialog({ title: date ? 'Edit sobriety date' : 'Set sobriety date', confirm: 'Save date',
    body: dateField(date),
    submit: async data => {
      await app.storage.update({ date: data.get('date') });
      announce('Sobriety date saved.');
    } });
}

async function clipboard(value, label, origin) {
  try {
    await navigator.clipboard.writeText(value);
    announce(label);
  } catch {
    openDialog({ title: 'Copy manually', cancel: 'Done', origin,
      body: `<p>Select and copy the text below.</p><label class="field"><span>Text to copy</span>
        <textarea data-initial-focus rows="5" readonly>${escape(value)}</textarea></label>` });
    dialog.querySelector('textarea').select();
  }
}

async function share(origin, data) {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
  }
  await clipboard(data.url, 'Link copied.', origin);
}

const actions = {
  setup,
  'skip-setup': async () => {
    await app.storage.update({ preferences: { onboarding: true } });
    announce('Setup skipped. Preferences are available in Settings.');
    render();
    main.focus({ preventScroll: true });
  },
  'edit-date': editDate,
  'reset-date': () => openDialog({
    title: 'Reset sobriety date?', body: '<p>The current date will be removed. Your journey continues, and you can add a new date whenever you’re ready.</p>',
    confirm: 'Reset date', danger: true, submit: async () => {
      await app.storage.update({ date: null });
      announce('Sobriety date reset.');
    },
  }),
  favorite: async trigger => {
    const id = trigger.dataset.key;
    await app.storage.toggle(id);
    const saved = app.storage.state.favorites.includes(id);
    trigger.setAttribute('aria-pressed', String(saved));
    announce(saved ? 'Added to favorites.' : 'Removed from favorites.');
  },
  share: trigger => share(trigger, { title: app.page.shareTitle, url: shareURL(location.hash.slice(1)) }),
  'share-app': trigger => share(trigger, { title: `${config.name} by ${config.organization}`, url: config.deployment }),
  'copy-prayer': trigger => clipboard(app.page.copyText, 'Text copied.', trigger),
  print: () => window.print(),
  'dismiss-dialog': () => dialog.close(),
  'choose-import': () => byId('import-file').click(),
  export: async () => {
    await app.storage.refresh();
    downloadBackup(app.storage.state);
    announce('Backup prepared.');
  },
  'clear-data': () => openDialog({
    title: 'Clear personal data?', body: '<p>This removes your sobriety date, preferences and favorites. Export a backup first if you want to keep a copy.</p>',
    confirm: 'Clear data', danger: true, submit: async () => {
      await app.storage.replace();
      setPreferences();
      Object.assign(filters, { query: '', category: '', favorites: false });
      announce('Personal data cleared.');
    },
  }),
  install: async () => {
    const prompt = app.installPrompt;
    if (!prompt) return;
    app.installPrompt = null;
    await prompt.prompt();
    render();
  },
  update: async () => {
    const worker = app.update;
    if (!worker) return;
    let reloadReady;
    const ready = new Promise(resolve => { reloadReady = resolve; });
    const changed = () => reloadReady(true);
    navigator.serviceWorker.addEventListener('controllerchange', changed, { once: true });
    const timer = setTimeout(() => reloadReady(false), 5000);
    worker.postMessage({ type: 'SKIP_WAITING' });
    const active = await ready;
    clearTimeout(timer);
    navigator.serviceWorker.removeEventListener('controllerchange', changed);
    if (active || worker.state === 'activated') location.reload();
    else announce('The update is still preparing. Try again in a moment.');
  },
};

document.addEventListener('click', async event => {
  if (event.target.closest('.skip')) {
    event.preventDefault();
    main.focus();
    return;
  }
  const trigger = event.target.closest('[data-action]');
  const action = trigger?.dataset.action;
  if (!action || !Object.hasOwn(actions, action) || pending.has(trigger)) return;
  pending.add(trigger);
  try { await actions[action](trigger); }
  catch (error) { announce(error?.message || 'Something went wrong. Try again.'); }
  finally { pending.delete(trigger); }
});

main.addEventListener('input', event => {
  if (event.target.name === 'prayer-search') {
    filters.query = event.target.value;
    renderPrayerResults(context());
  }
});

main.addEventListener('change', async event => {
  const target = event.target;
  const { name, value, checked } = target;
  if (name === 'prayer-category' || name === 'prayer-favorites') {
    if (name === 'prayer-category') filters.category = value;
    else filters.favorites = checked;
    renderPrayerResults(context());
    return;
  }
  try {
    if (target.id === 'import-file' && target.files[0]) {
      const origin = main.querySelector('[data-action="choose-import"]');
      const file = target.files[0];
      target.value = '';
      const next = await readBackup(file);
      if (!target.isConnected || dialog.open) return;
      openDialog({ title: 'Replace local data?',
        body: '<p>The backup passed validation. Importing it replaces your current sobriety date, preferences and favorites.</p>',
        origin, confirm: 'Import backup',
        submit: async () => {
          await app.storage.replace(next);
          setPreferences();
          announce('Backup imported.');
        } });
    } else if (name === 'prayer-language' || target.closest('#preference-form')) {
      const key = name === 'prayer-language' ? 'language' : name;
      await app.storage.update({ preferences: { [key]: value } });
      setPreferences();
      if (name === 'prayer-language') {
        if (target.isConnected) {
          render();
          byId('status').textContent = value === 'modern' ? 'Modern language selected.' : 'Original selected.';
        }
      } else announce('Preference saved.');
    }
  } catch (error) {
    render();
    announce(error?.message || 'The change could not be saved.');
  }
});

let lastRoute;
window.addEventListener('hashchange', () => {
  if (dialog.open && !dialog.dataset.busy) dialog.close();
  const next = route();
  if (lastRoute === 'prayers' || lastRoute?.startsWith('prayers/')) {
    if (next !== 'prayers' && !next.startsWith('prayers/')) Object.assign(filters, { query: '', category: '', favorites: false });
  }
  lastRoute = next;
  render({ navigate: true });
});

async function checkDay() {
  const date = today();
  if (app.date !== date) {
    app.date = date;
    if (['today', 'sobriety', 'settings'].includes(route()) && !dialog.open) render();
    const input = dialog.querySelector('[name="date"]');
    if (dialog.open && input) input.max = date;
  }
}

window.addEventListener('focus', async () => {
  if (!app.storage) return;
  const previous = JSON.stringify(app.storage.state);
  try { await app.storage.refresh(); } catch { /* Preserve the last visible state. */ }
  if (previous !== JSON.stringify(app.storage.state)) {
    setPreferences();
    if (!dialog.open) render();
  }
  checkDay();
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkDay(); });
window.addEventListener('online', notices);
window.addEventListener('offline', notices);

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  app.installPrompt = event;
  if (route() === 'settings' && !dialog.open) render();
});
window.addEventListener('appinstalled', () => {
  app.installPrompt = null;
  if (route() === 'settings' && !dialog.open) render();
  announce(`${config.name} installed.`);
});

async function startWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
    const showUpdate = () => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        app.update = registration.waiting;
        notices();
      }
    };
    function watchInstallation() {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed') showUpdate();
        if (worker.state === 'redundant' && !navigator.serviceWorker.controller) {
          app.pwaStatus = `Offline files could not be saved. Reopen ${config.name} online to try again.`;
          notices();
        }
      });
    }
    showUpdate();
    watchInstallation();
    registration.addEventListener('updatefound', watchInstallation);
  } catch {
    app.pwaStatus = 'Offline installation is unavailable in this browser.';
    notices();
  }
}

try {
  [app.content, app.storage] = await Promise.all([loadContent(), openStorage()]);
  setPreferences();
  notices();
  lastRoute = route();
  render();
  setInterval(checkDay, 15000);
  startWorker();
} catch {
  main.removeAttribute('aria-busy');
  renderChrome(null, '');
  main.innerHTML = `${heading({ title: `${config.name} could not open`, intro: 'Reconnect to the internet and try again. Your local data stays in this browser.' })}
    <a class="button" href="./">Try again ${icon('arrow')}</a>`;
}
