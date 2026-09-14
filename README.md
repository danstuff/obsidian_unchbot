# Unchbot

An [Obsidian](https://obsidian.md) plugin that automatically unchecks checklist items on a recurring schedule — handy for daily/weekly/monthly habits and chores tracked as tasks.

## How it works

Add a `%% @uncheck <period> %%` comment to the end of a checklist line, where `<period>` is a plain-English recurrence rule parsed by [rrule](https://github.com/jkbrzt/rrule)'s natural-language parser:

```markdown
- [ ] Water the plants %% @uncheck every day %%
- [ ] Take out the trash %% @uncheck every week on Monday %%
- [ ] Pay rent %% @uncheck every month on the 1st %%
- [ ] Renew passport %% @uncheck every year %%
```

Whenever you check one of these items off, Unchbot leaves it checked until its next scheduled occurrence, then automatically unchecks it so you can complete it again on the next cycle. Items with no `@uncheck` comment are left alone.

Supported phrases follow [rrule's natural language grammar](https://github.com/jkbrzt/rrule), e.g. `every day`, `every 2 weeks`, `every weekday`, `every month on the 1st and 15th`, `every year in June`, `every week on Monday, Wednesday, and Friday`.

## Usage

- Unchbot scans the vault automatically on a timer (configurable in **Settings → Unchbot**, default every 15 minutes) and once shortly after Obsidian starts.
- Run **Uncheck due checklist items now** from the command palette, or the **Run now** button in settings, to scan immediately.
- If a `@uncheck` period can't be understood, Unchbot shows a notice and logs the offending text to the developer console; the item is left untouched.

## Notes & limitations

- Recurrence timing is anchored to whenever Unchbot first saw the item (or, for items created before installing the plugin, whenever it first ran) — not necessarily local midnight. If Obsidian was closed when an item's schedule was due, Unchbot catches up and unchecks it on the next scan rather than firing once per missed occurrence.
- An item's identity is derived from its file path and its text (ignoring checked state). Renaming the item or moving it to another file resets its schedule.
- Unchbot only reads/writes files inside the vault and makes no network requests.

## Development

This project is built on the [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin) template.

```bash
npm install
npm run dev    # watch build
npm run build  # production build
npm run lint
```

For manual testing, copy `main.js`, `manifest.json` into `<Vault>/.obsidian/plugins/unchbot/`, then reload Obsidian and enable the plugin under **Settings → Community plugins**.

## Releasing

- Update `manifest.json` with the new version number and minimum Obsidian version.
- Update `versions.json` with `"new-plugin-version": "minimum-obsidian-version"`.
- Create a GitHub release tagged with the exact version number (no `v` prefix), and attach `manifest.json` and `main.js` as binary assets.

> `npm version patch|minor|major` bumps `manifest.json`/`package.json` and adds the `versions.json` entry automatically.

## Manually installing the plugin

- Copy `main.js`, `manifest.json` to `<Vault>/.obsidian/plugins/unchbot/`.
