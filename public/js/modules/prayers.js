import { config } from '../config.js';
import { find } from '../core/content.js';
import { card, escape, external, favoriteButton, heading, icon, paragraphs, readingSection, shareButton } from '../core/ui.js';

function prayerCard(item, categories) {
  return card({ href: `#/prayers/${item.id}`, title: item.title, description: categories[item.categories[0]],
    symbol: 'book', tone: item.editorialStatus === 'requires-review' ? 'amber' : 'sage' });
}

function sourceLine(source) {
  const title = source.rightsStatus === 'original-daymark' ? config.name : source.title;
  const page = String(source.page ?? '');
  return source.credit ?? [title, source.edition, page && `${page.includes('–') ? 'pp.' : 'p.'} ${page}`].filter(Boolean).join(' · ');
}

function sourceCard(source) {
  if (!source) return '';
  return readingSection('Source', `<p>${escape(sourceLine(source))}</p>
    ${source.note ? `<p>${escape(source.note)}</p>` : ''}
    ${source.url ? external(source.url, 'Read the source') : ''}`);
}

function canRead(item) {
  return item.source?.rightsStatus === 'original-daymark' ||
    (item.editorialStatus === 'published' && item.source?.rightsStatus === 'approved');
}

function prayerDetail(item, content, state) {
  const versions = canRead(item) ? ['original', 'modern'].filter(key => item[key]?.length) : [];
  const preferred = state.preferences.language;
  const language = versions.includes(preferred) ? preferred : versions[0];
  const text = language ? item[language] : null;
  const isDaymark = item.source?.rightsStatus === 'original-daymark';
  const excerpt = item.source?.excerpt && language === 'original';
  const credit = isDaymark ? `${config.name} prayer` : language === 'modern' ? `${config.name} adaptation` :
    excerpt ? 'Source excerpt' : 'Source text';
  const copyCredit = !isDaymark && language === 'original' && item.source ? sourceLine(item.source) : credit;
  const related = item.related.map(id => find(content.prayers, id)).filter(Boolean);

  return { title: item.title, shareTitle: item.title, copyText: text ? `${item.title}\n\n${text.join('\n\n')}\n\n${copyCredit}${language === 'modern' ? ' · Modern language' : ''}` : null, html: `
    <div class="reading">
      ${heading({ title: item.title, kicker: content.prayerCategories[item.categories[0]], back: '#/prayers', backLabel: 'Prayer Library' })}
      <div class="actions reading-actions">
        ${favoriteButton(state, `prayers/${item.id}`)}${shareButton()}
        ${text ? `<button class="button secondary" data-action="copy-prayer">${icon('copy')} Copy ${excerpt ? 'excerpt' : 'prayer'}</button>` : ''}
      </div>
      <div class="panel prayer-panel">
        ${versions.length > 1 ? `<fieldset class="segmented"><legend class="sr-only">Prayer language</legend>
          ${[['original', 'Original'], ['modern', 'Modern Language']].map(([value, label]) =>
            `<label><input type="radio" name="prayer-language" value="${value}" ${language === value ? 'checked' : ''}><span>${label}</span></label>`).join('')}
        </fieldset>` : ''}
        <div class="prayer-text" id="prayer-text" aria-live="polite">
          ${text ? `<span class="eyebrow">${escape(credit)}${language === 'modern' ? ' · Modern language' : ''}</span>${paragraphs(text)}` :
            `<h2>Source text pending review</h2>
              <p>${item.source?.url ? 'You can open the source below or choose a companion prayer to read offline.' : 'Choose a companion prayer below to read offline.'}</p>`}
        </div>
      </div>
      ${sourceCard(item.source)}
      ${related.length ? readingSection('Related prayers', `<div class="card-grid">${related.map(prayer => prayerCard(prayer, content.prayerCategories)).join('')}</div>`) : ''}
    </div>` };
}

export function prayers({ parts, content, state, filters }) {
  if (parts.length === 1) {
    const item = find(content.prayers, parts[0]);
    return item ? prayerDetail(item, content, state) : null;
  }
  if (parts.length) return null;
  const categories = content.prayerCategories;
  return { title: 'Prayer Library', html: `
    ${heading({ title: 'Prayer Library', intro: 'Find words for a quiet morning, a difficult moment, or something to be grateful for.' })}
    <div class="filter-panel">
      <label class="field search-field"><span>Search prayers</span><span class="search-input">${icon('search')}
        <input name="prayer-search" type="search" placeholder="Search by title or words" value="${escape(filters.query)}"></span></label>
      <label class="field"><span>Category</span><select name="prayer-category">
        <option value="">All categories</option>${Object.entries(categories).map(([id, category]) =>
          `<option value="${id}" ${filters.category === id ? 'selected' : ''}>${escape(category)}</option>`).join('')}</select></label>
      <label class="check-field"><input type="checkbox" name="prayer-favorites" ${filters.favorites ? 'checked' : ''}> Favorites only</label>
    </div>
    <p class="result-count" id="prayer-count" role="status"></p>
    <div class="card-grid" id="prayer-results"></div>` };
}

export function renderPrayerResults({ content, state, filters }) {
  const results = document.getElementById('prayer-results');
  if (!results) return;
  const terms = filters.query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches = content.prayers.filter(item => {
    if (filters.category && !item.categories.includes(filters.category)) return false;
    if (filters.favorites && !state.favorites.includes(`prayers/${item.id}`)) return false;
    const body = canRead(item) ? [...(item.original ?? []), ...(item.modern ?? [])] : [];
    const searchable = [item.title, item.source?.title, item.source?.note, ...body,
      ...item.categories.map(id => content.prayerCategories[id])].join(' ').toLowerCase();
    return terms.every(term => searchable.includes(term));
  });
  document.getElementById('prayer-count').textContent = `${matches.length} ${matches.length === 1 ? 'prayer' : 'prayers'}`;
  results.innerHTML = matches.length ? matches.map(item => prayerCard(item, content.prayerCategories)).join('') :
    '<p class="panel empty">No prayers match these filters.</p>';
}
