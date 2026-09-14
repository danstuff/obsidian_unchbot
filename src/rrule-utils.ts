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

/**
 * Finds the most recent recurrence at or before `now`, anchored at `baseline`.
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
	const rule = new RRule({ ...opts, dtstart: baseline });
	return rule.before(now, true);
}
