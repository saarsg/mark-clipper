// page-meta — JSON-LD + OpenGraph + standard meta tags → a markdown block (into editor).
// No Turndown needed. Returns md string, or {empty,message}.
(() => {
  const lines = [];

  // Standard + OG + Twitter meta tags
  const metas = {};
  document.querySelectorAll('meta[name], meta[property]').forEach(m => {
    const key = m.getAttribute('name') || m.getAttribute('property');
    const val = (m.getAttribute('content') || '').trim();
    if (key && val) metas[key] = val;
  });

  // JSON-LD blocks (parse defensively; page-controlled, so guard)
  const jsonld = [];
  document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
    try { jsonld.push(JSON.parse(s.textContent)); } catch { /* skip malformed */ }
  });

  if (Object.keys(metas).length === 0 && jsonld.length === 0) {
    return { empty: true, message: 'No metadata found on this page.' };
  }

  lines.push(`## Page metadata`, '');
  lines.push(`- **URL:** ${location.href}`);
  if (document.title) lines.push(`- **Title:** ${document.title}`);

  const interesting = ['description', 'author', 'keywords',
    'og:title', 'og:description', 'og:type', 'og:site_name', 'og:image',
    'twitter:title', 'twitter:description', 'twitter:card'];
  interesting.forEach(k => { if (metas[k]) lines.push(`- **${k}:** ${metas[k]}`); });

  // Meta-tag values are page-controlled. Route the prose block through the same postProcess
  // strip the Turndown features use (kills raw HTML + data:/javascript: URIs + invisible
  // Unicode), so page-meta doesn't bypass the sanitization the other capture paths get.
  if (window.WH && window.WH.resetInvisibleCount) window.WH.resetInvisibleCount();
  const pp = window.WH && window.WH.postProcess;
  let body = pp ? pp(lines.join('\n')) : lines.join('\n');

  if (jsonld.length) {
    // JSON.stringify doesn't escape backticks; a value containing ``` would close the json
    // fence early. Neutralize the sequence so the fenced block stays intact.
    const json = JSON.stringify(jsonld.length === 1 ? jsonld[0] : jsonld, null, 2)
      .replace(/`/g, 'ˋ');   // backtick → modifier-letter grave accent (visually identical, inert)
    body += `\n\n### JSON-LD\n\n\`\`\`json\n${json}\n\`\`\``;
  }

  return window.WH && window.WH.fence
    ? window.WH.fence(body, { source: location.href, captured: new Date().toISOString(), title: `Meta — ${document.title}` })
    : body + '\n';
})();
