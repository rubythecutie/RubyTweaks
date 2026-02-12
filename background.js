if (navigator.userAgent.indexOf("Chrome") != -1) {
  browser = chrome;
}

async function loadJSON(path) {
  const url = browser.runtime.getURL(path);
  const res = await fetch(url);
  return res.json();
}

async function findSiteForUrl(url) {
  if (!url || !url.startsWith("http")) return null;
  const hostname = new URL(url).hostname;
  const registry = await loadJSON("sites/registry.json");
  for (const [key, site] of Object.entries(registry)) {
    if (hostname.endsWith(site.domain)) {
      const meta = await loadJSON(site.meta);
      return { siteKey: key, site, meta };
    }
  }
  return null;
}

async function getEnabledMap() {
  const data = await browser.storage.local.get("enabled");
  return data.enabled || {};
}
async function setEnabledMap(map) {
  await browser.storage.local.set({ enabled: map });
}

async function updateBadge(tabId, url) {
  try {
    if (!url || !url.startsWith("http")) {
      await browser.action.setBadgeText({ tabId, text: "" });
      return;
    }
    const found = await findSiteForUrl(url);
    if (!found) {
      await browser.action.setBadgeText({ tabId, text: "" });
      return;
    }

    const { siteKey, site, meta } = found;
    const enabledMap = await getEnabledMap();
    const perSite = enabledMap[siteKey] || {};
    let count = 0;
    for (const tweak of meta.tweaks) {
      const enabled = perSite.hasOwnProperty(tweak.id) ? perSite[tweak.id] : true;
      if (enabled) count++;
    }

    await browser.action.setBadgeText({ tabId, text: count ? String(count) : "" });
    await browser.action.setBadgeBackgroundColor({ tabId, color: site.badgeColor || "#444" });
  } catch (e) {
    console.error("updateBadge error", e);
    await browser.action.setBadgeText({ tabId, text: "" });
  }
}

async function insertCss(tabId, cssPath) {
  try {
    await browser.scripting.insertCSS({
      target: { tabId },
      files: [cssPath]
    });
  } catch (e) {
    console.error("insertCss error", e);
  }
}

async function removeCss(tabId, cssPath) {
  try {
    await browser.scripting.removeCSS({
      target: { tabId },
      files: [cssPath]
    });
  } catch (e) {
    console.error("removeCss error", e);
  }
}

async function injectJs(tabId, jsPath) {
  try {
    await browser.scripting.executeScript({
      target: { tabId },
      files: [jsPath]
    });
  } catch (e) {
    console.error("injectJs error", e);
  }
}

async function applyTweaksToTab(tabId, url) {
  const found = await findSiteForUrl(url);
  if (!found) return;
  const { siteKey, meta } = found;
  const enabledMap = await getEnabledMap();
  const perSite = enabledMap[siteKey] || {};

  for (const tweak of meta.tweaks) {
    const enabled = perSite.hasOwnProperty(tweak.id) ? perSite[tweak.id] : true;
    const cssPath = tweak.css || null;
    const jsPath = tweak.js || null;

    if (cssPath) {
      if (enabled) {
        await insertCss(tabId, cssPath);
      } else {
        await removeCss(tabId, cssPath);
      }
    }

    if (jsPath) {
      if (enabled) {
        await injectJs(tabId, jsPath);
      }
    }
  }

  await updateBadge(tabId, url);
}

browser.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await browser.tabs.get(tabId);
    await applyTweaksToTab(tabId, tab.url);
  } catch (e) {}
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    await applyTweaksToTab(tabId, tab.url);
  }
});

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handleMessage = async () => {
    if (msg?.action === "setEnabled") {
      const { siteKey, tweakId, enabled } = msg;
      const map = await getEnabledMap();
      map[siteKey] = map[siteKey] || {};
      map[siteKey][tweakId] = enabled;
      await setEnabledMap(map);

      const registry = await loadJSON("sites/registry.json");
      const site = registry[siteKey];
      if (!site) return { ok: true };

      const tabs = await browser.tabs.query({});
      for (const t of tabs) {
        if (!t.url || !t.url.startsWith("http")) continue;
        if (new URL(t.url).hostname.endsWith(site.domain)) {
          await applyTweaksToTab(t.id, t.url);
        }
      }

      const meta = await loadJSON(site.meta);
      const tweak = meta.tweaks.find(x => x.id === tweakId);
      const needReload = Boolean(tweak && tweak.js);
      return { needReload };
    }

    if (msg?.action === "reloadTab") {
      if (typeof msg.tabId === "number") {
        await browser.tabs.reload(msg.tabId);
        return { reloaded: true };
      }
      return { reloaded: false };
    }

    if (msg?.action === "getState") {
      const registry = await loadJSON("sites/registry.json");
      const enabled = await getEnabledMap();
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0] || null;

      return {
        registry,
        enabled,
        tabUrl: tab ? tab.url : null,
        tabId: tab ? tab.id : null
      };
    }
  };

  handleMessage().then((response) => {
    if (response !== undefined) {
      sendResponse(response);
    }
  });

  return true;
});
