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

    // 1. Tag bold/italic on LIVE elements that intersect the selection (computed styles
    //    exist only on live nodes). 2. Clone the Range — clone inherits the data-wh-* tags.
    const marked = [];
    liveRoot.querySelectorAll('span, em, strong, i, b, a, code').forEach(el => {
      if (!range.intersectsNode(el)) return;
      const cs = getComputedStyle(el);
      const bold = parseInt(cs.fontWeight) >= 700;
      const italic = cs.fontStyle === 'italic';
      if (bold || italic) {
        el.dataset.whB = bold ? '1' : '0';
        el.dataset.whI = italic ? '1' : '0';
        marked.push(el);
      }
    });
    const container = document.createElement('div');
    container.appendChild(range.cloneContents());
    window.WH.cleanLiveTags(marked); // remove the temporary tags from the live page

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
