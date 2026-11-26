import { config } from '../config.js';
import { daypart, durationLabel, formatDate, sobriety, today } from '../core/dates.js';
import { growthMark, leafFall } from '../core/growth.js';
import { canRead } from './prayers.js';
import { milestoneCardSection, mountMilestoneCard } from './milestone-card.js';
import { badge, card, escape, heading, icon, sponsorActions } from '../core/ui.js';

const dayparts = {
  morning: { greeting: 'Good morning', icon: 'sunrise', practice: 'morning', cta: 'Begin your morning reflection' },
  afternoon: { greeting: 'Good afternoon', icon: 'sun', href: '#/prayers/pause-prayer', cta: 'Take a midday pause' },
  evening: { greeting: 'Good evening', icon: 'sunrise', practice: 'evening', cta: 'Look back on your day' },
  night: { greeting: 'Rest well tonight', icon: 'moon', practice: 'evening', cta: 'Close the day gently' },
};

function heroTracker(state, stats) {
  if (!stats) {
    return `<a class="hero-tracker" href="#/sobriety">
      <span class="hero-tracker-icon">${growthMark(null, { size: 'tiny' })}</span>
      <span><strong>${state.date ? 'View sobriety date' : 'Set a sobriety date'}</strong>
      <small>${state.date ? 'Check your device date' : 'Start whenever you’re ready'}</small></span>
      ${icon('arrow', 'card-arrow')}</a>`;
  }
  const remaining = stats.next.day - stats.days;
  return `<a class="hero-growth" href="#/sobriety" aria-label="${stats.days.toLocaleString()} calendar ${stats.days === 1 ? 'day' : 'days'} sober. Next milestone ${escape(stats.next.label)} in ${remaining} ${remaining === 1 ? 'day' : 'days'}.">
    ${growthMark(stats, { size: 'hero' })}
    <span class="hero-growth-copy">
      <span class="hero-count">${stats.days.toLocaleString()}</span>
      <span class="hero-count-unit">${stats.days === 1 ? 'day' : 'days'} sober</span>
      <small>Next: ${escape(stats.next.label)} · ${remaining} ${remaining === 1 ? 'day' : 'days'} to go</small>
    </span>
    ${icon('arrow', 'card-arrow')}</a>`;
}

function prayerOfTheDay(content, state, date) {
  const readable = content.prayers.filter(item => canRead(item) && (item.original?.length || item.modern?.length));
  if (!readable.length) return '';
  const [year, month, day] = date.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
  const prayer = readable[((dayNumber * 7) % readable.length + readable.length) % readable.length];
  const text = prayer[state.preferences.language]?.length ? prayer[state.preferences.language] : prayer.original ?? prayer.modern;
  // Show the opening sentences only. The full prayer is one tap away.
  const sentences = text[0].match(/[^.!?]+[.!?]+[”’"]?\s*/g) ?? [text[0]];
  let opening = '';
  for (const sentence of sentences) {
    if (opening && opening.length + sentence.length > 170) break;
    opening += sentence;
  }
  opening = opening.trim();
  const more = opening.length < text[0].trim().length || text.length > 1;
  return `<section class="today-highlight" aria-labelledby="daily-prayer-title">
    <p class="eyebrow">${icon('book')} Prayer for today</p>
    <h2 id="daily-prayer-title">${escape(prayer.title)}</h2>
    <blockquote class="daily-prayer-text"><p>${escape(opening)}${more ? ' …' : ''}</p></blockquote>
    <a class="button secondary" href="#/prayers/${escape(prayer.id)}">Read the full prayer ${icon('arrow')}</a>
  </section>`;
}

export function home({ state, content, registry, parts }) {
  if (parts.length) return null;
  const stats = sobriety(state.date);
  const [first, ...rest] = config.tagline.split(/(?<=\.)\s+/);
  const start = registry.find(feature => feature.home?.placement === 'support');
  const part = daypart();
  const time = dayparts[part];
  const suggestion = time.practice ? content.practices.find(item => item.id === time.practice) : null;
  const suggestHref = suggestion ? `#/practice/${suggestion.id}` : time.href;
  const milestone = stats?.reachedToday;
  const intro = milestone ? `You reached ${milestone.label} today. Take a moment to honor that.` :
    stats ? 'Every day is a chance to begin again.' : 'A place to begin, and a place to come back to.';
  return { title: 'Today', html: `
    <div class="today-heading">
      <p class="eyebrow">${icon('calendar')} <time datetime="${today()}">${escape(formatDate(today(), { weekday: 'long', month: 'long', day: 'numeric' }))}</time></p>
      <div class="today-heading-row">
        <h1>Today</h1>
        <button class="button secondary today-share no-print" type="button" data-action="share-app">${icon('share')} Share ${escape(config.name)}</button>
      </div>
    </div>
    <section class="hero" data-daypart="${part}" aria-label="Your day in recovery">
      <span class="hero-sky" aria-hidden="true"></span>
      ${milestone ? leafFall() : ''}
      <div class="hero-inner">
        <p class="eyebrow hero-label">${icon(time.icon)} ${escape(time.greeting)}</p>
        <p class="hero-title">${escape(first)}${rest.length ? `<br><em>${escape(rest.join(' '))}</em>` : ''}</p>
        <p class="hero-intro${milestone ? ' hero-milestone' : ''}">${escape(intro)}</p>
        <div class="hero-actions">
          ${heroTracker(state, stats)}
          ${suggestHref ? `<a class="hero-suggest" href="${escape(suggestHref)}">${escape(time.cta)} ${icon('arrow')}</a>` : ''}
        </div>
        <span class="hero-seal">
          <img src="${escape(config.organizationLogo)}" alt="${escape(config.organization)} crest" width="640" height="640">
        </span>
      </div>
    </section>
    <div class="today-support ${start ? 'card-grid' : ''}">
      <a href="#/moment" class="moment-banner">
        ${badge('pause', 'amber')}
        <span class="card-copy"><strong>I Need a Moment</strong><span>Take a breath and find your next step.</span></span>
        ${icon('arrow', 'card-arrow')}
      </a>
      ${state.sponsor ? `<div class="sponsor-strip">${badge('phone', 'clay')}
        <span class="card-copy"><strong>${escape(state.sponsor.name || 'Your sponsor')}</strong><span>One call away.</span></span>
        <span class="actions">${sponsorActions(state.sponsor, { compact: true })}</span></div>` : ''}
      ${start ? card({ ...start.home, href: `#/${start.id}`, symbol: start.icon }) : ''}
    </div>
    ${prayerOfTheDay(content, state, today())}
    <section class="home-section" aria-labelledby="daily-title">
      <h2 id="daily-title">Daily practice</h2>
      <div class="card-grid">${content.practices.map(item => card({
        href: `#/practice/${item.id}`, title: item.title,
        description: item.short, symbol: item.icon, tone: item.tone,
      })).join('')}
      ${card({ href: '#/journal', title: 'Journal', symbol: 'pen', tone: 'clay',
        description: state.journal[0]?.id === today() ? 'Today’s entry is saved.' : 'Gratitude and an honest look at the day.' })}
      ${card({ href: '#/moment/breathe', title: 'Breathe', symbol: 'wind', tone: 'lavender', description: 'A minute of slow, steady breathing.' })}</div>
    </section>
    <section class="home-section" aria-labelledby="resource-title">
      <h2 id="resource-title">Recovery resources</h2>
      <div class="card-grid">${registry.filter(feature => feature.home && !feature.home.placement).map(feature => card({
        ...feature.home, href: `#/${feature.id}`, symbol: feature.icon,
      })).join('')}</div>
    </section>
    ${state.preferences.onboarding ? '' : `<section class="welcome panel">
      <div><h2>Make it yours</h2><p>Choose a theme, prayer language and an optional sobriety date.</p></div>
      <div class="actions"><button class="button secondary" data-action="setup">Set up ${escape(config.name)}</button>
      <button class="button quiet" data-action="skip-setup">Skip setup</button></div>
    </section>`}` };
}

export function tracker({ state, parts }) {
  if (parts.length) return null;
  const stats = sobriety(state.date);
  const date = state.date;
  const controls = `<div class="actions"><button class="button" data-action="edit-date">${date ? 'Edit date' : 'Set sobriety date'}</button>
    ${date ? '<button class="button quiet" data-action="reset-date">Reset date</button>' : ''}</div>`;
  const details = stats ? `
    <section class="panel count-panel">
      ${stats.reachedToday ? leafFall(14) : ''}
      <div class="count-growth">${growthMark(stats, { size: 'large', label: `Growth ring: ${stats.percent}% of the way to ${stats.next.label}` })}</div>
      <p class="day-count">${stats.days.toLocaleString()}</p>
      <h2>${stats.days === 1 ? 'Calendar day sober' : 'Calendar days sober'}</h2>
      <p>${escape(durationLabel(stats))} since <time datetime="${date}">${escape(formatDate(date))}</time></p>
      ${stats.reachedToday ? `<p class="celebration">${icon('sunrise')} You reached ${escape(stats.reachedToday.label)} today. Take a moment to honor that.</p>` : ''}
      ${controls}
    </section>
    <section class="panel">
      <h2>Your next milestone</h2>
      <p><strong>${escape(stats.next.label)}</strong> on ${escape(formatDate(stats.next.date))}</p>
      <progress max="100" value="${stats.percent}" aria-label="Progress from your previous milestone"></progress>
      <p class="muted">${stats.next.day - stats.days} calendar ${stats.next.day - stats.days === 1 ? 'day' : 'days'} to go</p>
    </section>
    <section class="panel"><h2>Milestone dates</h2><ul class="plain-list milestone-list">${stats.marks.map(mark => `
      <li><span>${badge(mark.day <= stats.days ? 'check' : 'calendar')} ${escape(mark.label)}<span class="sr-only">${mark.day <= stats.days ? ', reached' : ', upcoming'}</span></span>
      <time datetime="${mark.date}">${escape(formatDate(mark.date))}</time></li>`).join('')}</ul></section>
    ${milestoneCardSection(stats)}` : `
    <section class="panel count-panel"><div class="count-growth">${growthMark(null, { size: 'large' })}</div>
      <h2>${date ? 'Check the calendar' : 'Start where you are'}</h2>
      <p>${date ? 'Your saved sobriety date is ahead of the device’s current date. Check the device clock or edit your date.' :
        'You can set a date whenever it feels right. You can use all the other resources today.'}</p>${controls}
    </section>`;
  return { title: 'Sobriety', mount: mountMilestoneCard, html: `<div class="reading">
    ${heading({ title: 'Sobriety tracker', intro: 'Every day gives you another chance to practice recovery.', back: '#/today', backLabel: 'Today' })}
    ${details}
    <details class="panel counting"><summary>How the tracker counts days</summary>
      <p>Your start date is day zero. The count advances at local midnight, so the “24 hours” milestone means one calendar day after your start date. Month and year milestones land on the last day of the target month if your original day is missing. Changing your device’s date or time zone can change the count.</p>
    </details></div>` };
}
