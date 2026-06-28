// capture-md — selection-aware page → fenced markdown.
// Runs in the source tab's isolated world. window.WH (from _md-setup.js) is injected first.
// Returns: the fenced markdown string, OR { empty:true, message } when nothing usable.
(() => {
  const sel = window.getSelection();
  const hasSelection = sel && sel.rangeCount > 0 && !sel.isCollapsed &&
    sel.toString().trim().length > 0;

  if (hasSelection) {
    const range = sel.getRangeAt(0);
    let liveRoot = range.commonAncestorContainer;
    if (liveRoot.nodeType === Node.TEXT_NODE) liveRoot = liveRoot.parentElement;

    // 1. Tag bold/italic AND invisible nodes on LIVE elements intersecting the selection
    //    (computed styles + geometry exist only on live nodes). 2. Clone the Range — the clone
    //    inherits the data-wh-* tags, so stripHidden() can drop the invisible ones.
    const inSel = el => range.intersectsNode(el);
    const markedBI = window.WH.tagBoldItalic(liveRoot, inSel);
    const markedH = window.WH.tagHidden(liveRoot, inSel);
    const container = document.createElement('div');
    container.appendChild(range.cloneContents());
    window.WH.cleanLiveTags(markedBI);
    window.WH.cleanHiddenTags(markedH);

    return window.WH.toMarkdownPreTagged(container, { heading: null });
  }

  // Whole-page: semantic root, else body.
  const root =
    document.querySelector('main') ||
    document.querySelector('[role="main"]') ||
    document.querySelector('article') ||
    document.body;
  return window.WH.toMarkdown(root, { heading: document.title });
})();
