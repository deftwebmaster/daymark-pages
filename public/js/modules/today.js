import { config } from '../config.js';
import { durationLabel, formatDate, sobriety, today } from '../core/dates.js';
import { badge, card, escape, heading, icon } from '../core/ui.js';

export function home({ state, content, registry, parts }) {
  if (parts.length) return null;
  const stats = sobriety(state.date);
  const [first, ...rest] = config.tagline.split(/(?<=\.)\s+/);
  const start = registry.find(feature => feature.home?.placement === 'support');
  const trackerLabel = stats ? `${stats.days.toLocaleString()} calendar ${stats.days === 1 ? 'day' : 'days'} sober` :
    state.date ? 'View sobriety date' : 'Set a sobriety date';
  return { title: 'Today', html: `
    <div class="today-heading">
      <p class="eyebrow">${icon('calendar')} <time datetime="${today()}">${escape(formatDate(today(), { weekday: 'long', month: 'long', day: 'numeric' }))}</time></p>
      <h1>Today</h1>
    </div>
    <section class="hero" aria-label="Your day in recovery">
      <div class="hero-inner">
        <p class="eyebrow hero-label">${icon('sunrise')} Your recovery companion</p>
        <p class="hero-title">${escape(first)}${rest.length ? `<br><em>${escape(rest.join(' '))}</em>` : ''}</p>
        <p class="hero-intro">${stats ? 'Every day is a chance to begin again.' : 'A place to begin, and a place to come back to.'}</p>
        <a class="hero-tracker" href="#/sobriety">
          <span class="hero-tracker-icon">${icon('leaf')}</span>
          <span><strong>${escape(trackerLabel)}</strong>
          <small>${stats ? `Since ${escape(formatDate(state.date, { month: 'short', day: 'numeric', year: 'numeric' }))} · Next: ${escape(stats.next.label)}` :
            state.date ? 'Check your device date' : 'Start whenever you’re ready'}</small></span>
          ${icon('arrow', 'card-arrow')}
        </a>
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
      ${start ? card({ ...start.home, href: `#/${start.id}`, symbol: start.icon }) : ''}
    </div>
    <section class="home-section" aria-labelledby="daily-title">
      <h2 id="daily-title">Daily practice</h2>
      <div class="card-grid">${content.practices.map(item => card({
        href: `#/practice/${item.id}`, title: item.title,
        description: item.short, symbol: item.icon, tone: item.tone,
      })).join('')}</div>
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
      ${badge('leaf')}
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
      <time datetime="${mark.date}">${escape(formatDate(mark.date))}</time></li>`).join('')}</ul></section>` : `
    <section class="panel count-panel">${badge('leaf')}
      <h2>${date ? 'Check the calendar' : 'Start where you are'}</h2>
      <p>${date ? 'Your saved sobriety date is ahead of the device’s current date. Check the device clock or edit your date.' :
        'You can set a date whenever it feels right. You can use all the other resources today.'}</p>${controls}
    </section>`;
  return { title: 'Sobriety', html: `<div class="reading">
    ${heading({ title: 'Sobriety tracker', intro: 'Every day gives you another chance to practice recovery.', back: '#/today', backLabel: 'Today' })}
    ${details}
    <details class="panel counting"><summary>How the tracker counts days</summary>
      <p>Your start date is day zero. The count advances at local midnight, so the “24 hours” milestone means one calendar day after your start date. Month and year milestones land on the last day of the target month if your original day is missing. Changing your device’s date or time zone can change the count.</p>
    </details></div>` };
}
