async function loadJSON(path) {
  const url = browser.runtime.getURL(path);
  const res = await fetch(url);
  return res.json();
}

async function updateBadge(tabId, url) {
  try {
    if (!url || !url.startsWith("http")) {
      browser.action.setBadgeText({ tabId, text: "" });
      return;
    }

    const hostname = new URL(url).hostname;
    const registry = await loadJSON("sites/registry.json");

    for (const site of Object.values(registry)) {
      if (hostname.endsWith(site.domain)) {
        const meta = await loadJSON(site.meta);
        const count = meta.tweaks.length;

        browser.action.setBadgeText({
          tabId,
          text: String(count)
        });

        browser.action.setBadgeBackgroundColor({
          tabId,
          color: site.badgeColor ?? "#444"
        });

        return;
      }
    }

    browser.action.setBadgeText({ tabId, text: "" });

  } catch (err) {
    console.error("Badge update failed:", err);
    browser.action.setBadgeText({ tabId, text: "" });
  }
}

browser.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await browser.tabs.get(tabId);
  updateBadge(tabId, tab.url);
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    updateBadge(tabId, tab.url);
  }
});
