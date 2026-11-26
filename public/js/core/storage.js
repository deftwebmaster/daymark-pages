import { parseDate, today } from './dates.js';

// Database schema 2 adds the journal store. Backup format 2 adds the sponsor contact and journal.
const SCHEMA = 2;
const BACKUP_VERSIONS = [1, 2];
const STORE_NAMES = ['profile', 'preferences', 'favorites', 'journal'];
export const limits = Object.freeze({ name: 60, phone: 24, gratitude: 280, reflection: 4000, entries: 3700 });
export const defaults = Object.freeze({
  theme: 'system', language: 'original', size: 'standard', motion: 'system', onboarding: false,
});
export const choices = Object.freeze({
  theme: ['system', 'light', 'dark'],
  language: ['original', 'modern'],
  size: ['standard', 'large', 'largest'],
  motion: ['system', 'reduced'],
});

const empty = () => ({ date: null, preferences: { ...defaults }, favorites: [], sponsor: null, journal: [] });
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validDate = date => date === null || (parseDate(date) && date <= today());
const validSetting = (key, value) => key === 'onboarding' ? typeof value === 'boolean' : choices[key]?.includes(value);
const validPhone = value => typeof value === 'string' && value.length <= limits.phone && /^\+?[\d\s().-]{3,}$/.test(value) && /\d{3}/.test(value.replace(/\D/g, ''));
const validSponsor = value => value === null || (isRecord(value) && typeof value.name === 'string' &&
  value.name.length <= limits.name && validPhone(value.phone));
const validEntry = value => isRecord(value) && Boolean(parseDate(value.id)) && value.id <= today() &&
  Array.isArray(value.gratitude) && value.gratitude.length <= 3 &&
  value.gratitude.every(item => typeof item === 'string' && item.length <= limits.gratitude) &&
  typeof value.reflection === 'string' && value.reflection.length <= limits.reflection;
const entryRecord = ({ id, gratitude, reflection }) => ({ id, gratitude: [...gratitude], reflection });
const byNewest = (a, b) => b.id.localeCompare(a.id);
const validFavorite = value => typeof value === 'string' && /^(?:(?:prayers|practice)\/[a-z0-9-]+|toolkit\/[a-z0-9-]+\/[a-z0-9-]+)$/.test(value);

function parseBackup(value) {
  if (!isRecord(value) || value.format !== 'daymark-backup' || !BACKUP_VERSIONS.includes(value.version)) {
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
  const sponsor = value.sponsor ?? null;
  if (!validSponsor(sponsor)) throw new Error('The backup contains an invalid sponsor contact.');
  const journal = value.journal ?? [];
  if (!Array.isArray(journal) || journal.length > limits.entries || !journal.every(validEntry) ||
    new Set(journal.map(entry => entry.id)).size !== journal.length) {
    throw new Error('The backup contains invalid journal entries.');
  }
  return { date: value.date, preferences: { ...defaults, ...value.preferences }, favorites: [...new Set(value.favorites)],
    sponsor: sponsor && { name: sponsor.name, phone: sponsor.phone }, journal: journal.map(entryRecord).sort(byNewest) };
}

export async function readBackup(file) {
  if (file.size > 4 * 1024 * 1024) throw new Error('The backup file is too large.');
  let parsed;
  try { parsed = JSON.parse(await file.text()); } catch {
    throw new Error('This file does not contain readable JSON.');
  }
  return parseBackup(parsed);
}

export function downloadBackup(state) {
  const file = new Blob([JSON.stringify({ format: 'daymark-backup', version: 2, ...state }, null, 2)],
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
        for (const store of ['profile', 'preferences', 'favorites', 'metadata']) request.result.createObjectStore(store, { keyPath: 'id' });
      }
      if (oldVersion < 2) request.result.createObjectStore('journal', { keyPath: 'id' });
      request.transaction.objectStore('metadata').put({ id: 'schema', value: SCHEMA });
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
  const [profile, preferences, favorites, journal] = await Promise.all(STORE_NAMES.map(name =>
    requestResult(transaction.objectStore(name).getAll())));
  const sponsor = profile.find(item => item.id === 'sponsor')?.value ?? null;
  return {
    date: profile.find(item => item.id === 'sobriety')?.value ?? null,
    sponsor: validSponsor(sponsor) ? sponsor : null,
    journal: journal.filter(validEntry).map(entryRecord).sort(byNewest),
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
    update({ date, preferences = {}, sponsor }) {
      if (date !== undefined && !validDate(date)) throw new Error('Choose a valid date up to today.');
      if (sponsor !== undefined && !validSponsor(sponsor)) throw new Error('Enter a name and a phone number with at least three digits.');
      const entries = Object.entries(preferences);
      if (entries.some(([key, value]) => !Object.hasOwn(defaults, key) || !validSetting(key, value))) {
        throw new Error('Choose a supported preference.');
      }
      return write(['profile', 'preferences'], store => {
        if (date === null) store('profile').delete('sobriety');
        else if (date !== undefined) store('profile').put({ id: 'sobriety', value: date });
        for (const [id, value] of entries) store('preferences').put({ id, value });
        if (sponsor === null) store('profile').delete('sponsor');
        else if (sponsor !== undefined) store('profile').put({ id: 'sponsor', value: sponsor });
      }, () => {
        if (date !== undefined) state.date = date;
        if (sponsor !== undefined) state.sponsor = sponsor;
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
    saveEntry(entry) {
      if (!validEntry(entry)) throw new Error('This journal entry could not be saved. Check its length and date.');
      const record = entryRecord(entry);
      return write(['journal'], store => store('journal').put(record), () => {
        state.journal = [record, ...state.journal.filter(item => item.id !== record.id)].sort(byNewest);
      });
    },
    deleteEntry(id) {
      return write(['journal'], store => store('journal').delete(id), () => {
        state.journal = state.journal.filter(item => item.id !== id);
      });
    },
    async refresh() {
      if (database) state = await load(database);
    },
    replace(snapshot = empty()) {
      return write(STORE_NAMES, store => {
        for (const name of STORE_NAMES) store(name).clear();
        if (snapshot.date) store('profile').put({ id: 'sobriety', value: snapshot.date });
        if (snapshot.sponsor) store('profile').put({ id: 'sponsor', value: snapshot.sponsor });
        for (const entry of snapshot.journal) store('journal').put(entry);
        if (!snapshot.favorites.length && Object.entries(defaults).every(([key, value]) => snapshot.preferences[key] === value)) return;
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
