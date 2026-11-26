const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  book: '<path d="M12 6C8 3 4 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 2zm0 0v15"/>',
  toolkit: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18m-9 0v3"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19m0-14-1.5 1.5m-11 11L5 19"/>',
  sunrise: '<path d="M3 17h18M5 21h14m-12-4a5 5 0 0 1 10 0M12 3v3m-7 3 2 2m12-2-2 2M2 13h2m16 0h2"/>',
  moon: '<path d="M21 13.5A8.5 8.5 0 0 1 10.5 3 9 9 0 1 0 21 13.5Z"/><path d="M17 3v4m-2-2h4"/>',
  leaf: '<path d="M20.5 3.5c-10-.7-16 3.2-16 10.5a5.5 5.5 0 0 0 5.5 5.5c7.3 0 11.2-6 10.5-16ZM3 21l12-12"/>',
  heart: '<path d="m12 21-8.6-8.2a5.2 5.2 0 0 1 7.4-7.4L12 6.6l1.2-1.2a5.2 5.2 0 0 1 7.4 7.4Z"/>',
  pause: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6m4-6v6"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6 6-6-6 6-6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m10 3-.8 2.3-2 .9L5 5.3 3.4 8l1.5 1.8-.2 2.4L3 14l1.6 2.8 2.4-.4 2 1 .8 2.6h3.3l.9-2.6 2-1 2.4.4L20 14l-1.6-1.8-.2-2.4L19.7 8l-1.6-2.7-2.3.9-2-.9L13 3z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  share: '<path d="M12 15V3m-4 4 4-4 4 4M7 11H4v10h16V11h-3"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 5V3H4v13h1"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m16 16 4 4"/>',
  external: '<path d="M13 4h7v7m0-7L9 15m1-11H4v16h16v-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  print: '<path d="M7 7V3h10v4m-10 9H3V8h18v8h-4M7 13h10v8H7z"/>',
  file: '<path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8m-8 4h8"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5"/>',
  phone: '<path d="M7 3H4c-1 10 7 18 17 17v-4l-5-2-2 2a12 12 0 0 1-6-6l2-2z"/>',
  message: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8m-8 3h5"/>',
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v6m4-6v6"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 21h16"/>',
};

const reducedMotion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

export function prefersReducedMotion() {
  return Boolean(reducedMotion?.matches) || document.documentElement.dataset.motion === 'reduced';
}

export const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export function icon(name, className = '') {
  return `<svg class="icon ${className}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? paths.leaf}</svg>`;
}

export function badge(name, tone = 'sage') {
  return `<span class="icon-badge tone-${tone}">${icon(name)}</span>`;
}

export function card({ href, title, description, symbol, tone = 'sage', label = '' }) {
  return `<a class="link-card" href="${escape(href)}">
    ${badge(symbol, tone)}
    <span class="card-copy">${label ? `<small>${escape(label)}</small>` : ''}<strong>${escape(title)}</strong>
    ${description ? `<span>${escape(description)}</span>` : ''}</span>
    ${icon('arrow', 'card-arrow')}
  </a>`;
}

export function heading({ title, intro, back, backLabel, kicker }) {
  return `<header class="page-heading">
    ${back ? `<a class="back" href="${escape(back)}">${icon('back')}${escape(backLabel)}</a>` : ''}
    ${kicker ? `<p class="eyebrow">${escape(kicker)}</p>` : ''}
    <h1>${escape(title)}</h1>${intro ? `<p class="lead">${escape(intro)}</p>` : ''}
  </header>`;
}

export function paragraphs(items) {
  return items.map(item => `<p>${escape(item)}</p>`).join('');
}

export function list(items, ordered = false) {
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag} class="reading-list">${items.map(item => `<li>${escape(item)}</li>`).join('')}</${tag}>`;
}

export function external(url, label) {
  return `<a class="external" href="${escape(url)}" rel="noreferrer">${escape(label)} ${icon('external')}<span class="external-note"> (online)</span></a>`;
}

export function readingSection(title, body) {
  return `<section class="reading-section"><h2>${escape(title)}</h2>${body}</section>`;
}

export function favoriteButton(state, id) {
  return `<button class="button secondary" data-action="favorite" data-key="${escape(id)}"
    aria-pressed="${state.favorites.includes(id)}">${icon('heart')} Favorite</button>`;
}

export function shareButton(label = 'Share link') {
  return `<button class="button secondary" data-action="share">${icon('share')} ${escape(label)}</button>`;
}

export function telHref(phone) {
  return String(phone ?? '').replace(/[^\d+]/g, '');
}

export function sponsorActions(sponsor, { compact = false } = {}) {
  if (!sponsor) {
    return `<button class="button secondary" type="button" data-action="edit-sponsor">${icon('phone')} Add your sponsor’s number</button>`;
  }
  const number = telHref(sponsor.phone);
  const who = sponsor.name || 'my sponsor';
  return `<a class="button" href="tel:${escape(number)}">${icon('phone')} Call ${escape(who)}</a>
    <a class="button secondary" href="sms:${escape(number)}">${icon('message')} ${compact ? 'Text' : `Text ${escape(who)}`}</a>`;
}
