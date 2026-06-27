# Web Helper

A personal Chromium **web workbench**. Click the toolbar icon to open a docked **side panel**:
capture page or selection content as clean markdown, edit it, then export it or send it to an
AI chat (Claude / ChatGPT / Gemini). The page stays visible beside the panel.

## Install (unpacked)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Toggle **Developer mode** (top-right).
3. Click **Load unpacked** → select this `extension` folder.
4. Pin it from the puzzle-piece menu.
5. Click the icon → the **side panel** opens. Chrome will warn that the extension can **read your
   data on all websites** — that's the `host_permissions` it uses to auto-follow the active tab.
6. The capture **source auto-follows the active tab**: whatever page is in front is what the capture
   features read. The panel header always shows the current source URL — glance at it to see what
   *will* be captured.

## How it works

- **Side panel** (`chrome.sidePanel`). The toolbar icon (`background.js` → `chrome.action.onClicked`)
  opens the panel for the current window. The **source tab auto-follows**: `background.js` tracks
  `tabs.onActivated` / `onUpdated` / `windows.onFocusChanged` and writes the active tab to
  `chrome.storage.local`, which the panel reads to repaint the source URL live.
- **Permissions are NOT minimal — by design.** `host_permissions: ["<all_urls>"]` lets
  `executeScript` run on any tab without a per-click gesture, which is what enables auto-follow. The
  cost: the extension *can* read every page you visit (Chrome's install warning reflects this). This
  is a deliberate tradeoff for the auto-follow UX; the data still never leaves your machine.
- Browser/internal pages (`chrome://`, the web store, `view-source:`) can't be scripted by any
  extension — capturing one shows a clear "can't capture browser pages" message, not an error.
- **Capture** features inject a small script (`features/<id>.js`) into the source tab via
  `chrome.scripting.executeScript`, in the page's isolated world, and return data to the
  workbench. Markdown features reuse one shared pipeline (`features/_md-setup.js`).
- **Persistence:** editor content + the clip stack live in `chrome.storage.local` — they
  survive a browser restart, stay on this machine, and are never synced.

## Feature contract

Every feature has a fixed identity: one id, one verb-noun name, one output, one UI zone.
New features follow the same shape — no loose, half-defined actions.

Every capture/view feature **inserts at the editor cursor** (or appends if the editor isn't
focused) — so you can place a capture, table, or clip exactly where it belongs rather than always
tacking it onto the end. The shared `insertAt` primitive (workbench.js) handles the spacing + caret.

| id | Name | Output | Zone |
|---|---|---|---|
| `capture-md` | Capture as Markdown | selection-or-page → fenced markdown at cursor | Capture |
| `clip-selection` | Clip selection | selection → attributed blockquote at cursor | Capture |
| `extract-tables` | Extract Tables | every `<table>` → GFM tables at cursor | View |
| `page-meta` | Page Metadata | JSON-LD / OpenGraph / meta → markdown block at cursor | View |

The editor always holds **Markdown** (the single source of truth). Two action groups act on it:

**Send to AI** — one primary action with the knobs behind an **Options** disclosure:

| Control | What it does |
|---|---|
| **provider + Copy & Open** (default view) | Copies the shaped payload to the clipboard and opens the chosen AI in a new tab. You paste — never auto-submitted. |
| **Options ▸** → **Format** (md / HTML / plain / JSON) | Derives the chosen output *from* the editor markdown ("HTML" is rendered from markdown, not page-grade cleaned HTML). |
| **Options ▸** → **Context Pack** | Wraps the content in YAML frontmatter + an XML `<document>` block; the Instruction is appended as the task *after* `</document>`. |
| **Options ▸** → **Instruction** | Optional named preset — Summarize / Critique / Extract action items / Q&A-flashcards / Explain. Prepended to the content (or appended after the document with Context Pack on). |
| **Options ▸** → **Copy only** | Same payload, no tab opened. |

**Editor tools** — produce content into the editor: **Insert source link** (a markdown link + the
bare source URL, from the captured page metadata) and **Export file** (format + Context Pack only —
a data file never carries the instruction, so an exported `.json` stays valid JSON).

**Clear** and **Collapse** live as icon buttons in the editor bar (top-right), not on the menu —
Collapse folds the editor away so the action menu reclaims the space. The bar shows a live **char +
~token estimate** (chars/4).

> **No network, no API key, no auto-submit.** Every action assembles text locally and puts it on
> your clipboard (or downloads a file). Sending content to an AI is always a manual paste. An
> API-key "summarize on device" path is deliberately *not* built — it would send page content
> off-machine; it's held for an explicit opt-in.

## Security model

Page content is treated as **untrusted input** — it can carry prompt-injection payloads that
would hijack an AI you later paste it into. Every markdown capture therefore:

- **Strips hidden elements** (`display:none` / `visibility:hidden` / `aria-hidden` / `hidden`)
  and structural noise (`script`/`style`/`iframe`/`svg`/`nav`/`footer`…) before conversion —
  closing the main invisible-injection vector. *Limit:* class-based hiding via external
  stylesheets is not detectable in a detached clone.
- **Wraps output in an UNTRUSTED-CONTENT fence** (frontmatter `warning:` + a visible banner)
  so any downstream AI/human sees the content is data, not instructions.
- **Sanitizes** surviving raw HTML, `data:` image URIs, and `javascript:` links.
- **Never auto-submits.** "Copy & Open" only puts text on your clipboard and opens the AI tab;
  *you* paste — the human stays in the loop.

**Permissions (as of v0.3.0):** `scripting`, `storage`, `clipboardWrite`, `tabs`, `sidePanel`, and
`host_permissions: ["<all_urls>"]`. The host permission is the deliberate non-minimal choice — it
enables auto-follow (scripting any tab without a per-click gesture) at the cost of read access to
every page you visit. Earlier versions used `activeTab` (click-tab only, no host access); that was
dropped for the auto-follow UX. Captured content still never leaves the machine — the host
permission grants *reading* pages, not sending them anywhere.

## Adding a feature

1. Create `features/<id>.js`. It runs in the page's isolated world and **returns** a value
   (markdown string, a data object, or `{ empty:true, message }`).
2. Add a `<button data-feature="<id>">` to the right zone in `workbench.html`.
3. If it needs the markdown pipeline, add `<id>` to `NEEDS_TURNDOWN` in `workbench.js` and use
   `window.WH` helpers (`toMarkdown`, `fence`, `stripHidden`, …).
4. Handle its result shape in `handleFeatureResult` (workbench.js) if it isn't a plain
   markdown string.
5. Reload from `chrome://extensions` (circular-arrow icon).

## Caveats

- Class-based hidden-text stripping has the limit noted above — fine for the common low-effort
  injection, not a guarantee.
- Context Pack neutralizes a forged `</document>` delimiter in the body (the realistic literal /
  attributed / case forms). Exotic split forms like `< /document>` aren't covered — an accepted
  limit for opportunistic page injection on a personal tool, not a hardened guarantee.
- **Plain-text format weakens the untrusted-content fence.** `plain` output drops the frontmatter
  and strips the `>` marker off the UNTRUSTED-CONTENT banner, so the warning reads as ordinary
  prose. Markdown, HTML, and JSON keep the warning text intact — prefer those when the destination
  AI should see the data/instructions boundary. (Context Pack re-asserts the boundary regardless.)
- Works on Chrome / Edge / Brave. Firefox needs `browser_specific_settings` in the manifest.
