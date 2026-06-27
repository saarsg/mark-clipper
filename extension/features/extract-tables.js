// extract-tables — every <table> on the page → GFM markdown tables (into editor).
// Needs window.WH (Turndown + gfm). Returns md string, or {empty,message}.
(() => {
  const tables = [...document.querySelectorAll('table')]
    .filter(t => t.querySelector('td, th')); // skip layout/empty tables
  if (tables.length === 0) return { empty: true, message: 'No tables found on this page.' };

  const td = window.WH.makeService();
  const parts = tables.map((table, i) => {
    const clone = table.cloneNode(true);
    window.WH.stripHidden(clone);
    let md = window.WH.postProcess(td.turndown(clone));
    const cap = table.querySelector('caption');
    const heading = cap && cap.textContent.trim() ? cap.textContent.trim() : `Table ${i + 1}`;
    return `## ${heading}\n\n${md}`;
  });

  return window.WH.fence(parts.join('\n\n'), {
    source: location.href,
    captured: new Date().toISOString(),
    title: `Tables — ${document.title}`,
  });
})();
