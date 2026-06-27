# Web Helper

A side-panel workbench for capturing web pages and selections as clean markdown —
edit it locally, then copy or export it to the AI assistant of your choice.

![Web Helper side panel — screenshot placeholder](docs/screenshot.png)

## Why this exists

- **Capturing web content for an AI is fiddly.** Copy-paste drags in navigation,
  ads, and hidden junk; Web Helper gives you clean markdown of the page or just
  your selection, dropped where your cursor is.
- **No accounts, no API keys, nothing leaves your machine.** Everything is
  assembled locally and stored on your computer. Sending to an AI is always a
  manual paste — never auto-submitted.
- **Built for research and personal use** — direct, honest about its tradeoffs,
  and small enough to read end to end.

## Install

### From the Chrome Web Store

Install from the listing, pin the icon, and click it to open the side panel.

### Unpacked (for development)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Toggle **Developer mode** (top-right).
3. Click **Load unpacked** → select the `extension` folder.
4. Pin it from the puzzle-piece menu.

On first use, Chrome warns that the extension can **read your data on all
websites**. That is the `host_permissions` it uses to auto-follow your active tab
— see [Permissions and security](#permissions-and-security) for exactly what that
does and does not mean.

## Usage

1. Click the toolbar icon → the **side panel** opens beside the page.
2. The capture **source auto-follows your active tab** — the panel header always
   shows the current source URL, so you can see what *will* be captured.
3. **Capture as Markdown** grabs the page (or your selection) as fenced markdown,
   inserted at your cursor in the editor.
4. Other captures: **Clip selection** (attributed blockquote), **Extract Tables**,
   **Page Metadata**.
5. Edit freely. The editor content persists across restarts.
6. **Send to AI** → pick a provider and **Copy & Open**: the text is copied to
   your clipboard and the AI chat opens in a new tab. You paste it — nothing is
   auto-submitted.
7. **Options ▸** reveals extras: output format (markdown / HTML / plain / JSON),
   a **Context Pack** (frontmatter + document block), and a prompt **Instruction**.
   **Insert source link** and **Export file** live under Editor tools.

Browser/internal pages (`chrome://`, the web store, `view-source:`) can't be
scripted by any extension — capturing one shows a clear message, not an error.

## Permissions and security

Web Helper's permissions are **deliberately not minimal**, and the reasoning is
worth stating plainly.

### Why `<all_urls>`

The capture source auto-follows your active tab: switch tabs and the next capture
hits the page now in front of you, with no per-page click to grant access. To
inject the capture script into *whatever* tab you switch to, the extension needs
host access to all sites. An earlier version used `activeTab` (access only to the
tab you clicked from); that broke capture the moment you switched tabs, which is
the friction this design fixes.

**Reading is not sending.** Chrome's warning reflects that the extension *can*
read every page you visit. It does not transmit them. Captured content is
assembled locally and stored only in `storage.local`; nothing leaves your machine
unless you explicitly copy or export it. The extension makes no network requests
of its own.

### Page content is treated as untrusted

A captured page can carry prompt-injection payloads aimed at an AI you later paste
into. So every markdown capture:

- **Strips hidden elements** (`display:none` / `visibility:hidden` / `aria-hidden`
  / `hidden`) and structural noise (`script`/`style`/`iframe`/`nav`/`footer`…)
  before conversion. *Limit:* class-based hiding via external stylesheets isn't
  detectable in a detached clone.
- **Wraps output in an UNTRUSTED-CONTENT fence** so a downstream AI or human sees
  it is data, not instructions.
- **Sanitizes** surviving raw HTML, `data:` image URIs, and `javascript:` links.
- **Never auto-submits** — Copy & Open only puts text on your clipboard and opens
  the tab; you paste.

Full per-permission justifications, as submitted to the Chrome Web Store, are in
[`docs/permission-justifications.md`](docs/permission-justifications.md).

### Known limits (no hedging)

- Class-based hidden-text stripping has the limit above — fine for common
  low-effort injection, not a guarantee.
- Context Pack neutralizes a forged `</document>` delimiter in realistic forms;
  exotic split forms like `< /document>` aren't covered — an accepted limit for a
  personal tool.
- The **plain-text** format drops the frontmatter and the `>` marker, weakening
  the untrusted-content warning. Prefer markdown / HTML / JSON when the destination
  AI should see the data/instructions boundary (Context Pack re-asserts it anyway).

An API-key "summarize on device" path is **deliberately not built** — it would
send page content off-machine, breaking the never-auto-submit invariant. It's held
for an explicit opt-in.

## How it works (architecture)

- **Side panel** (`chrome.sidePanel`), not a popup. `background.js` opens it on
  icon click and tracks `tabs.onActivated` / `onUpdated` / `windows.onFocusChanged`
  to keep the capture source following your active tab, writing it to
  `storage.local` for the panel to read.
- **Capture features** inject a small script (`features/<id>.js`) into the source
  tab via `chrome.scripting.executeScript`, in the page's isolated world, and
  return data to the workbench. Markdown features reuse one shared pipeline
  (`features/_md-setup.js`).
- **Feature contract:** every feature is one id, one verb-noun name, one output,
  one UI zone. Editor writes funnel through a single `insertAt` primitive so
  captures land at the cursor.
- **Persistence:** editor content lives in `chrome.storage.local` — survives a
  restart, stays on this machine, never synced.

For the full technical reference (feature table, adding a feature, browser
support), see [`extension/README.md`](extension/README.md).

## License

Open source. See [LICENSE](LICENSE).
