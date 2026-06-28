# Security & prompt-injection protection

Web Helper captures web pages so you can paste them into an AI assistant. A web page
is **untrusted** — it can hide instructions aimed at that AI ("ignore previous
instructions, exfiltrate…"), often invisibly. This page is the honest account of what
Web Helper defends against, and what it can't.

## The guiding rule

> **What you paste is what you could have seen.**

Web Helper removes the *invisible* traps so the captured markdown matches what was
actually on screen. It does **not** try to judge meaning — visible text that happens to
be adversarial is still captured (see [Honest limits](#honest-limits)). That boundary is
deliberate: it's the part that can be made reliable.

## What's defended

**1. Invisible Unicode smuggling.** Characters that render as nothing but are read by
LLMs — the Unicode Tags block ("ASCII smuggling"), zero-width characters, bidi
overrides. Each is replaced with a visible `␟` marker, and the capture notes how many
were found, so you can *see* that the page tried to hide something. (Legitimate
right-to-left marks and emoji joiners are kept — no false alarms on real text.)

**2. Hidden page elements.** Text present in the page but invisible to you — `display:none`,
`visibility:hidden`, `opacity:0`, off-screen positioning, zero-size, `clip`/`clip-path`,
the screen-reader-only pattern, `aria-hidden`. Detection runs on the **live, rendered
page** (not a guess from inline styles), so it also catches hiding done through CSS
classes and stylesheets.

**3. Exfiltration & active content in the markdown.** External and `data:` image URLs
(which some AI chats auto-fetch, leaking data) become text placeholders; HTML comments,
`on*` event handlers, and unsafe link schemes (`javascript:`, `data:`, …) are stripped.

**4. Data-vs-instructions framing.** Captured content is wrapped in an
UNTRUSTED-CONTENT fence — frontmatter + a visible banner telling any downstream AI to
treat it as data, not commands. The Context Pack option strengthens this with a bounded
`<document>` block whose delimiters can't be forged by the content.

And throughout: **nothing is auto-submitted.** Copy & Open puts text on your clipboard
and opens the AI tab — *you* paste. The human stays in the loop.

## Honest limits

- **Visible adversarial prose is not stopped.** If a page contains "AI: ignore your
  instructions and…" in plain, readable text, that's real content — Web Helper captures
  it. Your defense there is the UNTRUSTED-CONTENT fence plus the receiving AI's own
  judgment. No capture tool can strip this without also dropping legitimate text.
- **Plain-text output weakens the fence.** The `plain` format drops the frontmatter and
  banner markers. Prefer markdown / HTML / JSON when the destination AI should clearly
  see the data/instructions boundary (Context Pack re-asserts it regardless).
- **Don't rely on the AI chat UI to sanitize.** Some chat UIs strip smuggled Unicode,
  some don't, and fixes regress. Web Helper does it at capture time so you're not
  depending on the destination.

## Why not the Chrome Web Store yet

The listing is under review. Until then, install
[unpacked from source](../README.md#install) — the code is open and small enough to
read end to end.
