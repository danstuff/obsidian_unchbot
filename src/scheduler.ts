import type UnchbotPlugin from './main';
import {
	extractStandaloneUncheckPeriod,
	extractUncheckPeriod,
	headerLevel,
	itemKey,
	parseChecklistLine,
	setChecked,
} from './checklist';
import { canParsePeriod, mostRecentOccurrence } from './rrule-utils';
import { ItemState } from './types';

interface HeaderSection {
	level: number;
	/** The most recently seen standalone `@uncheck` period under this header, if any. */
	period: string | null;
}

/** Finds the innermost enclosing header section that has a period set. */
function sectionPeriod(stack: HeaderSection[]): string | null {
	for (let i = stack.length - 1; i >= 0; i--) {
		if (stack[i]!.period !== null) return stack[i]!.period;
	}
	return null;
}

export interface UncheckPassResult {
	filesChanged: number;
	itemsUnchecked: number;
	/** Unique `@uncheck` period strings that couldn't be parsed this pass. */
	parseErrors: string[];
}

/**
 * Scans every markdown file for `%% @uncheck <period> %%` checklist items,
 * unchecks any that are due for their next recurrence, and rebuilds the
 * plugin's tracked item state to match what's currently in the vault.
 */
export async function runUncheckPass(plugin: UnchbotPlugin): Promise<UncheckPassResult> {
	const now = Date.now();
	const nowDate = new Date(now);
	const nextItemState: Record<string, ItemState> = {};
	const parseErrors = new Set<string>();
	let filesChanged = 0;
	let itemsUnchecked = 0;

	for (const file of plugin.app.vault.getMarkdownFiles()) {
		const content = await plugin.app.vault.cachedRead(file);
		if (!content.includes('@uncheck')) continue;

		const lines = content.split('\n');
		const dueAndChecked = new Set<string>();
		const sectionStack: HeaderSection[] = [];

		for (const line of lines) {
			const level = headerLevel(line);
			if (level !== null) {
				while (sectionStack.length && sectionStack[sectionStack.length - 1]!.level >= level) {
					sectionStack.pop();
				}
				sectionStack.push({ level, period: null });
				continue;
			}

			const standalonePeriod = extractStandaloneUncheckPeriod(line);
			if (standalonePeriod !== null) {
				if (sectionStack.length > 0) {
					sectionStack[sectionStack.length - 1]!.period = standalonePeriod;
				}
				continue;
			}

			const match = parseChecklistLine(line);
			if (!match) continue;

			const period = extractUncheckPeriod(line) ?? sectionPeriod(sectionStack);
			if (!period) continue;

			const key = itemKey(file.path, match);
			const prior = plugin.data.itemState[key];
			const baseline = prior ? new Date(prior.lastProcessed) : nowDate;

			const occurrence = mostRecentOccurrence(period, baseline, nowDate);
			if (!occurrence) {
				if (!canParsePeriod(period)) parseErrors.add(period);
				nextItemState[key] = prior ?? { lastProcessed: now };
				continue;
			}

			const due = occurrence.getTime() > baseline.getTime();
			nextItemState[key] = due
				? { lastProcessed: occurrence.getTime() }
				: (prior ?? { lastProcessed: now });

			if (due && match.checked) {
				dueAndChecked.add(key);
			}
		}

		if (dueAndChecked.size === 0) continue;

		await plugin.app.vault.process(file, (data) => {
			const freshLines = data.split('\n');
			let changed = false;
			for (let i = 0; i < freshLines.length; i++) {
				const freshMatch = parseChecklistLine(freshLines[i]!);
				if (!freshMatch || !freshMatch.checked) continue;
				if (!dueAndChecked.has(itemKey(file.path, freshMatch))) continue;
				freshLines[i] = setChecked(freshMatch, false);
				changed = true;
			}
			return changed ? freshLines.join('\n') : data;
		});
		filesChanged++;
		itemsUnchecked += dueAndChecked.size;
	}

	plugin.data.itemState = nextItemState;
	await plugin.saveData(plugin.data);

	return { filesChanged, itemsUnchecked, parseErrors: [...parseErrors] };
}
