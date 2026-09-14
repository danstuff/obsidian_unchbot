export interface UnchbotSettings {
	/** How often, in minutes, to scan the vault for items due to be unchecked. */
	checkIntervalMinutes: number;
}

export interface ItemState {
	/** Epoch ms of the last recurrence occurrence that was processed for this item. */
	lastProcessed: number;
}

export interface UnchbotData {
	settings: UnchbotSettings;
	/** Keyed by a stable identity derived from file path + item text, see checklist.ts. */
	itemState: Record<string, ItemState>;
}
