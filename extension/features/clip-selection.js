// clip-selection — current selection → attributed markdown blockquote, inserted at the caret.
// Plain-text selection (no Turndown). Returns md string, or {empty,message}.
(() => {
  const sel = window.getSelection();
  const text = sel ? sel.toString().trim() : '';
  if (!text) return { empty: true, message: 'Select some text first, then Clip selection.' };

  const quoted = text.replace(/\r/g, '').split('\n').map(l => `> ${l}`).join('\n');
  const title = document.title || location.hostname;
  // Citation line. Source is a plain URL — no active content.
  return `${quoted}\n>\n> — [${title}](${location.href})\n`;
})();
