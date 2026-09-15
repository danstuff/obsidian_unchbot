import { Options, RRule } from 'rrule';

// Parsing the same period text happens on every scan for every matching item,
// so cache the (cheap but non-trivial) natural-language parse result.
const parseCache = new Map<string, Partial<Options> | null>();

function parsePeriod(periodText: string): Partial<Options> | null {
	const key = periodText.trim().toLowerCase();
	const cached = parseCache.get(key);
	if (cached !== undefined) return cached;

	let opts: Partial<Options> | null;
	try {
		opts = RRule.parseText(periodText) ?? null;
		if (opts && opts.freq === undefined) opts = null;
	} catch {
		opts = null;
	}
	parseCache.set(key, opts);
	return opts;
}

/** Returns true if `periodText` is a recognized recurrence rule. */
export function canParsePeriod(periodText: string): boolean {
	return parsePeriod(periodText) !== null;
}

/** Midnight, local time, on the same day as `date`. */
function startOfLocalDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Finds the most recent recurrence at or before `now`, anchored at local
 * midnight on `baseline`'s day. Anchoring to midnight (rather than the exact
 * time `baseline` represents) keeps daily/weekly/monthly rules aligned to
 * calendar days instead of the wall-clock time an item happened to be first
 * seen or last unchecked.
 * Returns null if `periodText` can't be parsed, or if no occurrence has
 * happened yet.
 */
export function mostRecentOccurrence(
	periodText: string,
	baseline: Date,
	now: Date,
): Date | null {
	const opts = parsePeriod(periodText);
	if (!opts) return null;
	const rule = new RRule({ ...opts, dtstart: startOfLocalDay(baseline) });
	return rule.before(now, true);
}
