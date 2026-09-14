import { Notice, Plugin } from 'obsidian';
import { runUncheckPass } from './scheduler';
import { DEFAULT_SETTINGS, UnchbotSettingTab } from './settings';
import { UnchbotData } from './types';

const MIN_CHECK_INTERVAL_MINUTES = 1;

export default class UnchbotPlugin extends Plugin {
	data!: UnchbotData;
	private running = false;
	private intervalId: number | null = null;

	async onload() {
		await this.loadPluginData();

		this.addSettingTab(new UnchbotSettingTab(this.app, this));

		this.addCommand({
			id: 'run-uncheck-pass',
			name: 'Uncheck due checklist items now',
			callback: () => void this.runPass(true),
		});

		this.app.workspace.onLayoutReady(() => void this.runPass(false));
		this.restartInterval();
	}

	onunload() {}

	async loadPluginData() {
		const stored = (await this.loadData()) as Partial<UnchbotData> | null;
		this.data = {
			settings: { ...DEFAULT_SETTINGS, ...stored?.settings },
			itemState: stored?.itemState ?? {},
		};
	}

	async saveSettings() {
		await this.saveData(this.data);
	}

	/** Re-reads the configured interval and restarts the periodic scan timer. */
	restartInterval() {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
		}
		const minutes = Math.max(
			MIN_CHECK_INTERVAL_MINUTES,
			this.data.settings.checkIntervalMinutes,
		);
		this.intervalId = this.registerInterval(
			window.setInterval(() => void this.runPass(false), minutes * 60 * 1000),
		);
	}

	async runPass(notify: boolean) {
		if (this.running) return;
		this.running = true;
		try {
			const result = await runUncheckPass(this);

			if (notify) {
				new Notice(
					result.itemsUnchecked > 0
						? `Unchbot: unchecked ${result.itemsUnchecked} item(s) in ${result.filesChanged} file(s).`
						: 'Unchbot: nothing to uncheck.',
				);
			}

			if (result.parseErrors.length > 0) {
				new Notice(
					`Unchbot: couldn't understand ${result.parseErrors.length} recurrence rule(s). See the developer console for details.`,
				);
				console.warn('Unchbot: unparseable @uncheck periods', result.parseErrors);
			}
		} finally {
			this.running = false;
		}
	}
}
