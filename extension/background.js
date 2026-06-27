// Service worker: clicking the toolbar icon opens the Web Helper SIDE PANEL, and the capture
// SOURCE auto-follows the active tab. With host_permissions:<all_urls>, executeScript works on any
// tab without a per-click gesture grant, so the panel always targets whatever page is in front.
// (Tradeoff the user accepted: this extension can read every page you visit — Chrome warns about it
// at install. The privacy posture is intentionally relaxed here in exchange for auto-follow.)

// Record a tab as the capture source. The panel's storage.onChanged listener repaints the source
// URL live, so the header always shows what WILL be captured. Internal browser pages can't be
// scripted — we still record the URL so the display is honest; capture fails with a clear message.
function recordSource(tab) {
  if (!tab || tab.id == null || !tab.url) return;
  chrome.storage.local.set({ sourceTabId: tab.id, sourceTabUrl: tab.url });
}

// Open the side panel on icon click. sidePanel.open() must run inside the user gesture, so call it
// FIRST and synchronously — any awaited call before it drops the gesture context and open() throws.
chrome.action.onClicked.addListener((tab) => {
  if (tab && tab.windowId != null) {
    chrome.sidePanel.open({ windowId: tab.windowId })
      .catch(err => console.error('[web-helper] sidePanel.open failed:', err));
  }
  recordSource(tab);
});

// Auto-follow: the source is whatever tab is active+focused now.
// 1) switching tabs in a window
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId).then(recordSource).catch(() => {});
});
// 2) the active tab navigating to a new URL. onUpdated fires per sub-resource — guard so we only
//    write on a real navigation of the ACTIVE tab, not on every asset load.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab && tab.active && (changeInfo.url || changeInfo.status === 'complete')) recordSource(tab);
});
// 3) focusing a different window. onFocusChanged fires WINDOW_ID_NONE (-1) when Chrome loses focus
//    entirely — ignore that so we don't blank the source when you alt-tab away.
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  chrome.tabs.query({ active: true, windowId }).then(([tab]) => recordSource(tab)).catch(() => {});
});
