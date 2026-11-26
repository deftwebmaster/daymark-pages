import { parseDate, today } from './dates.js';

const SCHEMA = 1;
const STORE_NAMES = ['profile', 'preferences', 'favorites'];
export const defaults = Object.freeze({
  theme: 'system', language: 'original', size: 'standard', motion: 'system', onboarding: false,
});
export const choices = Object.freeze({
  theme: ['system', 'light', 'dark'],
  language: ['original', 'modern'],
  size: ['standard', 'large', 'largest'],
  motion: ['system', 'reduced'],
});

const empty = () => ({ date: null, preferences: { ...defaults }, favorites: [] });
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validDate = date => date === null || (parseDate(date) && date <= today());
const validSetting = (key, value) => key === 'onboarding' ? typeof value === 'boolean' : choices[key]?.includes(value);
const validFavorite = value => typeof value === 'string' && /^(?:(?:prayers|practice)\/[a-z0-9-]+|toolkit\/[a-z0-9-]+\/[a-z0-9-]+)$/.test(value);

function parseBackup(value) {
  if (!isRecord(value) || value.format !== 'daymark-backup' || value.version !== SCHEMA) {
    throw new Error('Choose a backup exported from this app in the supported format.');
  }
  if (!validDate(value.date)) throw new Error('The backup sobriety date is invalid or is in the future.');
  if (!isRecord(value.preferences) || Object.entries(value.preferences).some(([key, setting]) =>
    !Object.hasOwn(defaults, key) || !validSetting(key, setting))) {
    throw new Error('The backup contains invalid preferences.');
  }
  if (!Array.isArray(value.favorites) || value.favorites.length > 1000 || !value.favorites.every(validFavorite)) {
    throw new Error('The backup contains invalid favorites.');
  }
  return { date: value.date, preferences: { ...defaults, ...value.preferences }, favorites: [...new Set(value.favorites)] };
}

export async function readBackup(file) {
  if (file.size > 256 * 1024) throw new Error('The backup file is too large.');
  let parsed;
  try { parsed = JSON.parse(await file.text()); } catch {
    throw new Error('This file does not contain readable JSON.');
  }
  return parseBackup(parsed);
}

export function downloadBackup(state) {
  const file = new Blob([JSON.stringify({ format: 'daymark-backup', version: SCHEMA, ...state }, null, 2)],
    { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'newleaf-backup.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function completed(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onabort = () => reject(transaction.error || new Error('Storage transaction interrupted.'));
  });
}

function connect() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('daymark-local', SCHEMA);
    let abandoned = false;
    const timeout = setTimeout(() => {
      abandoned = true;
      reject(new Error('Storage did not open in time.'));
    }, 2500);
    request.onupgradeneeded = ({ oldVersion }) => {
      if (oldVersion < 1) {
        for (const store of [...STORE_NAMES, 'metadata']) request.result.createObjectStore(store, { keyPath: 'id' });
        request.transaction.objectStore('metadata').put({ id: 'schema', value: SCHEMA });
      }
    };
    request.onsuccess = () => {
      clearTimeout(timeout);
      if (abandoned) request.result.close();
      else resolve(request.result);
    };
    request.onerror = () => { clearTimeout(timeout); reject(request.error); };
    request.onblocked = () => {
      clearTimeout(timeout);
      abandoned = true;
      reject(new Error('Another tab is blocking storage.'));
    };
  });
}

async function load(database) {
  const transaction = database.transaction(STORE_NAMES, 'readonly');
  const [profile, preferences, favorites] = await Promise.all(STORE_NAMES.map(name =>
    requestResult(transaction.objectStore(name).getAll())));
  return {
    date: profile.find(item => item.id === 'sobriety')?.value ?? null,
    preferences: { ...defaults, ...Object.fromEntries(preferences.filter(item =>
      Object.hasOwn(defaults, item.id) && validSetting(item.id, item.value)).map(item => [item.id, item.value])) },
    favorites: favorites.map(item => item.id).filter(validFavorite),
  };
}

export async function openStorage() {
  let database;
  let state = empty();
  try {
    database = await connect();
    database.onversionchange = () => database.close();
    state = await load(database);
  } catch {
    database?.close();
    database = null;
  }

  async function write(stores, change, updateLocal) {
    if (database) {
      const transaction = database.transaction(stores, 'readwrite');
      const done = completed(transaction);
      try {
        change(name => transaction.objectStore(name));
      } catch (error) {
        transaction.abort();
        await done.catch(() => {});
        throw error;
      }
      await done;
      try { state = await load(database); }
      catch {
        // The transaction committed. Keep the visible state in sync with it.
        updateLocal();
      }
    } else updateLocal();
  }

  return {
    get state() { return state; },
    persistent: Boolean(database),
    update({ date, preferences = {} }) {
      if (date !== undefined && !validDate(date)) throw new Error('Choose a valid date up to today.');
      const entries = Object.entries(preferences);
      if (entries.some(([key, value]) => !Object.hasOwn(defaults, key) || !validSetting(key, value))) {
        throw new Error('Choose a supported preference.');
      }
      return write(['profile', 'preferences'], store => {
        if (date === null) store('profile').delete('sobriety');
        else if (date !== undefined) store('profile').put({ id: 'sobriety', value: date });
        for (const [id, value] of entries) store('preferences').put({ id, value });
      }, () => {
        if (date !== undefined) state.date = date;
        Object.assign(state.preferences, preferences);
      });
    },
    toggle(id) {
      if (!validFavorite(id)) throw new Error('This resource cannot be saved.');
      return write(['favorites'], store => {
        const favorites = store('favorites');
        const request = favorites.get(id);
        request.onsuccess = () => request.result ? favorites.delete(id) : favorites.put({ id });
      }, () => {
        state.favorites = state.favorites.includes(id) ? state.favorites.filter(item => item !== id) : [...state.favorites, id];
      });
    },
    async refresh() {
      if (database) state = await load(database);
    },
    replace(snapshot = empty()) {
      return write(STORE_NAMES, store => {
        for (const name of STORE_NAMES) store(name).clear();
        if (snapshot.date) store('profile').put({ id: 'sobriety', value: snapshot.date });
        if (!snapshot.date && !snapshot.favorites.length && Object.entries(defaults).every(([key, value]) => snapshot.preferences[key] === value)) return;
        for (const [id, value] of Object.entries(snapshot.preferences)) store('preferences').put({ id, value });
        for (const id of snapshot.favorites) store('favorites').put({ id });
      }, () => { state = structuredClone(snapshot); });
    },
  };
}

export function applyPreferences(preferences, persistent) {
  const root = document.documentElement;
  root.dataset.theme = preferences.theme;
  root.dataset.size = preferences.size;
  root.dataset.motion = preferences.motion;
  if (persistent) {
    try {
      if (preferences.theme === defaults.theme) localStorage.removeItem('daymark.theme');
      else localStorage.setItem('daymark.theme', preferences.theme);
    } catch {
      // The app still works when the synchronous theme hint cannot be stored.
    }
  }
}
