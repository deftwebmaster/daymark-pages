// Date-only records use the proleptic Gregorian calendar. No elapsed-clock conversions.
export function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > monthLength(year, month)) return null;
  return { year, month, day };
}

function monthLength(year, month) {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function ordinal({ year, month, day }) {
  const prior = year - 1;
  let count = 365 * prior + Math.floor(prior / 4) - Math.floor(prior / 100) + Math.floor(prior / 400) + day;
  for (let index = 1; index < month; index++) count += monthLength(year, index);
  return count;
}

function iso({ year, month, day }) {
  return [String(year).padStart(4, '0'), pad(month), pad(day)].join('-');
}

const pad = number => String(number).padStart(2, '0');

export function today(date = new Date()) {
  return iso({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() });
}

export function formatDate(value, options = { dateStyle: 'long' }) {
  const calendar = parseDate(value);
  if (!calendar) return '';
  const display = new Date(0);
  display.setUTCFullYear(calendar.year, calendar.month - 1, calendar.day);
  return new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' }).format(display);
}

function addMonths(date, months) {
  const index = date.month - 1 + months;
  const year = date.year + Math.floor(index / 12);
  const month = index % 12 + 1;
  return { year, month, day: Math.min(date.day, monthLength(year, month)) };
}

function addDays(date, days) {
  let { year, month, day } = date;
  day += days;
  while (day > monthLength(year, month)) {
    day -= monthLength(year, month);
    if (month === 12) { month = 1; year++; } else month++;
  }
  return { year, month, day };
}

export function sobriety(value, endValue = today()) {
  const start = parseDate(value);
  const end = parseDate(endValue);
  if (!start || !end || value > endValue) return null;
  const startDay = ordinal(start);
  const days = ordinal(end) - startDay;
  let totalMonths = (end.year - start.year) * 12 + end.month - start.month;
  if (ordinal(addMonths(start, totalMonths)) > ordinal(end)) totalMonths--;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const remainder = ordinal(end) - ordinal(addMonths(start, totalMonths));

  const milestones = [
    ...[[1, '24 hours'], [30, '30 days'], [60, '60 days'], [90, '90 days']]
      .map(([amount, label]) => [addDays(start, amount), label]),
    ...[[6, '6 months'], [9, '9 months'], [12, '1 year']]
      .map(([amount, label]) => [addMonths(start, amount), label]),
  ];
  const nextYear = Math.max(2, years + 1);
  for (const year of new Set([...(years >= 2 ? [years] : []), nextYear, nextYear + 1])) {
    milestones.push([addMonths(start, year * 12), `${year} years`]);
  }
  const marks = milestones.map(([date, label]) => ({
    label, date: iso(date), day: ordinal(date) - startDay,
  }));
  const reachedToday = marks.find(mark => days === mark.day);
  const next = marks.find(mark => days < mark.day);
  const last = marks.filter(mark => days >= mark.day).at(-1)?.day ?? 0;
  return { days, years, months, remainder, marks, next, reachedToday, percent: Math.floor((days - last) / (next.day - last) * 100) };
}

export function durationLabel(stats) {
  const plural = (value, unit) => `${value} ${unit}${value === 1 ? '' : 's'}`;
  return [stats.years && plural(stats.years, 'year'), stats.months && plural(stats.months, 'month'),
    (stats.remainder || (!stats.years && !stats.months)) && plural(stats.remainder, 'day')].filter(Boolean).join(', ');
}
