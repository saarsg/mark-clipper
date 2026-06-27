# Permission Justifications — Web Helper

One paragraph per requested permission, reflecting how the extension actually
uses it.

## `scripting`

Web Helper captures content by injecting a small, self-contained script into the
page you are viewing (`chrome.scripting.executeScript`), running in the page's
isolated world, which reads the text/tables/metadata and returns it to the side
panel. This is the core mechanism of every capture feature — without `scripting`
there is no way to read the page content into the workbench. The injected scripts
only read and convert content; they do not modify the page or persist on it.

## `storage`

The editor is the single source of truth, and its content is saved to
`chrome.storage.local` so your work survives a browser restart and a panel
reload. This is local storage on your own machine only — it is never synced to a
browser account or any cloud, and it holds nothing but your editor text and a few
UI preferences (e.g. which tab is the current capture source). Removing the
extension or clicking Clear discards it.

## `clipboardWrite`

The primary output path — "Copy & Open" and "Copy only" — writes the assembled
markdown (or chosen format) to your clipboard so you can paste it into an AI chat
or anywhere else. The extension only ever *writes* to the clipboard on your
explicit action; it does not read your clipboard.

## `tabs`

The side panel needs to know which tab is currently in front so it can show the
correct source URL and capture the right page. Web Helper listens for tab
activation/update and window focus changes to keep the panel's "source" pointed
at your active tab (the auto-follow behavior). It reads tab URLs to display the
current source and to detect un-capturable browser pages (`chrome://`, the web
store); it does not read tab content through this permission.

## `sidePanel`

The entire interface is a docked side panel (`chrome.sidePanel`) rather than a
popup or full tab, so the workbench stays open beside the page you are reading and
capturing from. This permission is what lets the toolbar icon open that panel and
keep it persistent while you work.

## `host_permissions: <all_urls>`

This is the load-bearing permission, and it is requested deliberately. Web Helper
auto-follows your active tab: when you switch tabs, the side panel's capture
source updates automatically so the next capture hits the page actually in front
of you — no per-page click-to-grant, no silent breakage when you change tabs. To
inject the capture script into *whatever* tab you switch to, the extension needs
host access to all sites; a narrower or click-gated permission (the earlier
`activeTab` model) granted access only to the tab you clicked from, which broke
capture the moment you switched tabs — the exact friction this design fixes.
Chrome's install warning ("read your data on all websites") accurately reflects
that the extension *can* read every page you visit. What it does **not** do is
send those pages anywhere: reading is local, captured content is assembled on your
machine and stored only in `storage.local`, and nothing is transmitted unless you
explicitly copy or export it. The host permission grants reading, not sending.
