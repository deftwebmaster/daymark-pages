import { config } from '../config.js';
import { find } from '../core/content.js';
import { formatDate } from '../core/dates.js';
import { card, escape, external, heading, icon, readingSection, telHref } from '../core/ui.js';
import { toolkitItem, toolkitTitle } from './toolkit.js';

const labels = {
  theme: { system: 'Follow device', light: 'Light', dark: 'Dark' },
  language: { original: 'Original', modern: 'Modern Language' },
  size: { standard: 'Standard', large: 'Large', largest: 'Extra large' },
  motion: { system: 'Follow device', reduced: 'Reduce motion' },
};

export function preferenceField(key, label, value) {
  return `<label class="field"><span>${escape(label)}</span><select name="${key}">
    ${Object.entries(labels[key]).map(([id, option]) =>
      `<option value="${id}" ${id === value ? 'selected' : ''}>${escape(option)}</option>`).join('')}
    </select></label>`;
}

export function more({ parts }) {
  if (parts.length) return null;
  return { title: 'More', html: `${heading({ title: 'More' })}
    <div class="card-grid">${[
      ['settings', 'Settings', 'Choose preferences and manage local data.', 'settings'],
      ['new-to-recovery', 'New to Recovery', 'Find a place to start with meetings, sponsorship, and daily practice.', 'leaf'],
      ['favorites', 'Favorites', 'Return to prayers and resources you’ve saved.', 'heart'],
      ['sobriety', 'Sobriety tracker', 'Dates, calendar days and milestones.', 'leaf'],
      ['practice', 'Daily Practice', 'Guided morning and evening reflections.', 'sunrise'],
      ['journal', 'Journal', 'Gratitude lists and evening inventories, kept on this device.', 'pen'],
      ['privacy', 'Privacy', 'See what the app stores on your device.', 'lock'],
      ['about', `About ${config.organization}`, `Get to know the work behind ${config.name}.`, 'people'],
    ].map(([id, title, description, symbol]) => card({ href: `#/${id}`, title, description, symbol })).join('')}</div>` };
}

export function favorites({ parts, content, state }) {
  if (parts.length) return null;
  const saved = state.favorites.map(key => {
    const [group, , id] = key.split('/');
    const item = group === 'toolkit' ? toolkitItem(content, id) : find(group === 'prayers' ? content.prayers : content.practices, key.split('/')[1]);
    if (!item) return null;
    return card({ href: `#/${key}`, title: toolkitTitle(item), symbol: group === 'prayers' ? 'book' : 'heart',
      description: group === 'toolkit' ? 'Sponsor Toolkit' : group === 'prayers' ? 'Prayer Library' : 'Daily Practice' });
  }).filter(Boolean);
  return { title: 'Favorites', html: `${heading({ title: 'Favorites', back: '#/more', backLabel: 'More' })}
    ${saved.length ? `<div class="card-grid">${saved.join('')}</div>` : `<p class="panel empty">Tap Favorite on a prayer, reflection, or sponsor resource to save it here.</p>`}` };
}

export function settings({ parts, content, state, installable, offlineUnavailable }) {
  if (parts.length) return null;
  const prefs = state.preferences;
  return { title: 'Settings', html: `<div class="reading settings">
    ${heading({ title: 'Settings', back: '#/more', backLabel: 'More' })}
    ${readingSection('Sobriety date', `<p>${state.date ? escape(formatDate(state.date)) : 'You can add a date whenever you’re ready.'}</p>
      <a class="button secondary" href="#/sobriety">Manage sobriety date ${icon('arrow')}</a>`)}
    ${readingSection('Your sponsor', `<p>${state.sponsor ? `${escape(state.sponsor.name || 'Sponsor')} · <a href="tel:${escape(telHref(state.sponsor.phone))}">${escape(state.sponsor.phone)}</a>` :
        'Save your sponsor’s number for one-tap calls and texts from Today and I Need a Moment.'}</p>
      <div class="actions"><button class="button secondary" data-action="edit-sponsor">${icon('phone')} ${state.sponsor ? 'Edit contact' : 'Add contact'}</button>
      ${state.sponsor ? '<button class="button quiet" data-action="remove-sponsor">Remove</button>' : ''}</div>`)}
    ${readingSection('Appearance and reading', `<form class="preferences-grid" id="preference-form">
      ${preferenceField('theme', 'Theme', prefs.theme)}
      ${preferenceField('language', 'Prayer language', prefs.language)}
      ${preferenceField('size', 'Reading text size', prefs.size)}
      ${preferenceField('motion', 'Motion', prefs.motion)}
      </form>`)}
    ${readingSection(`Install ${config.name}`, `
      ${installable ? `<p><button class="button" data-action="install">Install ${escape(config.name)}</button></p>` : ''}
      <details><summary>iPhone or iPad</summary><p>Open this app in Safari, tap Share, then Add to Home Screen. If shown, turn on Open as Web App and tap Add.</p></details>
      <details><summary>Android</summary><p>In Chrome, open the browser menu and choose Add to Home screen or Install app.</p></details>
      <details><summary>Desktop</summary><p>Use the install icon in the address bar or the browser’s install menu when available. In Safari on supported Macs, choose File, then Add to Dock.</p></details>
      <p>${offlineUnavailable ? 'This browser can’t save the app for offline use. Open it in Safari, Chrome, Edge, or Firefox to install it.' :
        'The app downloads its offline library on your first successful online visit.'}</p>`)}
    ${readingSection('Your data', `<p>Settings, your sobriety date, sponsor contact, journal, and favorites live in this browser. Clearing browser storage or removing the app can erase them. A backup contains your personal data in readable JSON. Keep it somewhere private.</p>
      <div class="actions"><button class="button secondary" data-action="export">Export data</button>
      <button class="button secondary" data-action="choose-import">Import data</button>
      <button class="button danger" data-action="clear-data">Clear personal data</button></div>
      <input type="file" id="import-file" accept=".json,application/json" hidden>`)}
    ${readingSection('App information', `<div class="actions">
      <a class="button secondary" href="#/favorites">${icon('heart')} Favorites</a>
      <a class="button secondary" href="#/privacy">${icon('lock')} Privacy</a>
      <a class="button secondary" href="#/about">About ${escape(config.organization)}</a></div>
      <p class="muted">App version ${escape(config.version)} · Content version ${escape(content.version)}</p>`)}
    </div>` };
}

export function privacy({ parts }) {
  if (parts.length) return null;
  return { title: 'Privacy', html: `<article class="reading">
    ${heading({ title: 'Privacy', intro: 'Your recovery information stays in this browser.', back: '#/more', backLabel: 'More' })}
    ${readingSection('What the app stores', '<p>The app saves your optional sobriety date, sponsor contact, journal entries, favorites, and preferences on your device. It uses your theme preference to set the appearance as the app opens. It downloads app files and recovery readings for offline use.</p><p>There are no accounts, ads, or analytics. Nothing you write in the journal leaves this device unless you export a backup. The app does not save which difficult moments you open. Your browser can still retain recently visited addresses.</p>')}
    ${readingSection('Who can see it', '<p>Local data is readable by someone with access to this browser profile or to an exported backup. Local data and backups are unencrypted. The static host receives normal requests for app files. These requests do not include your sobriety date or personal recovery information.</p>')}
    ${readingSection('Your choices', '<p>Export, import, or erase your personal data from <a href="#/settings">Settings</a>. Clearing browser storage or removing the app can erase local data. External sites, calls, and sharing services follow their own privacy practices. Shared links point to public resources.</p>')}
    </article>` };
}

export function about({ parts }) {
  if (parts.length) return null;
  return { title: 'About', html: `<article class="reading">
    ${heading({ title: `About ${config.name}`, intro: 'A free companion for prayer, reflection, sponsorship, and the everyday work of recovery.', back: '#/more', backLabel: 'More' })}
    <section class="reading-section about-mission">
      <img class="organization-seal" src="${escape(config.organizationLogo)}" width="640" height="640"
        alt="${escape(config.organization)} emblem with wings, a cross, and mountains. The motto reads ‘You are worth it and you can do it.’">
      <div class="about-mission-copy">
        <h2>${escape(config.organization)}</h2>
        <p>${escape(config.organization)} was founded by John Hyder to support the recovery community through art and service. ${escape(config.name)} carries that work into daily life through reflection and practical ways to ask for help and offer it.</p>
        ${external(config.site, `Visit ${config.organization}`)}
      </div>
    </section>
    ${readingSection('An independent resource', `<p>${escape(config.name)} is an independent recovery resource. It is not affiliated with or endorsed by Alcoholics Anonymous. The guides draw on Twelve Step principles and welcome people from any recovery path.</p><p>For support, speak with a sponsor, recovery peer, or qualified care professional. In an emergency, call your local emergency number. The app cannot provide emergency services, treatment, professional care, or sponsorship.</p>`)}
    <img class="about-artwork" src="${escape(config.organizationArtwork)}" width="1080" height="1080" loading="lazy"
      alt="${escape(config.organization)} emblem surrounded by illustrated portraits and mountain landscapes.">
    </article>` };
}
