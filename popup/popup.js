if (navigator.userAgent.indexOf("Chrome") != -1) {
  browser = chrome;
}

(async function(){
  const $ = sel => document.querySelector(sel);
  const tweaksList = $("#tweaks");
  const noTweaks = $("#no-tweaks");
  const reloadBtn = $("#reloadBtn");
  const siteHeader = $("#siteHeader");
  const siteNameEl = $("#siteName");
  const siteDomainEl = $("#siteDomain");

  const state = await browser.runtime.sendMessage({ action: "getState" });
  const registry = state.registry || {};
  let enabledMap = state.enabled || {};
  const tabUrl = state.tabUrl || "";
  const tabId = state.tabId;

  function findSiteKeyForHostname(hostname) {
    for (const [k, v] of Object.entries(registry)) {
      if (hostname.endsWith(v.domain)) return k;
    }
    return null;
  }

  if (!tabUrl || !tabUrl.startsWith("http")) {
    noTweaks.textContent = "No tweaks available for this page 😞";
    return;
  }

  const hostname = new URL(tabUrl).hostname;
  const siteKey = findSiteKeyForHostname(hostname);

  if (!siteKey) {
    noTweaks.textContent = "No tweaks active 😴";
    return;
  }

  const siteInfo = registry[siteKey];
  let meta;
  try {
    meta = await fetch(browser.runtime.getURL(siteInfo.meta)).then(r => r.json());
  } catch (e) {
    console.error("Failed to load meta.json", e);
    noTweaks.textContent = "Failed to load site metadata.";
    return;
  }

  siteHeader.classList.remove("hidden");
  siteNameEl.textContent = meta.name || siteKey;
  siteDomainEl.textContent = siteInfo.domain;
  noTweaks.classList.add("hidden");

  enabledMap[siteKey] = enabledMap[siteKey] || {};

  function createTweakItem(tweak) {
    const li = document.createElement("li");
    li.className = "tweak";

    const row = document.createElement("div");
    row.className = "tweak-row";

    const info = document.createElement("div");
    info.className = "tweak-info";
    const title = document.createElement("div");
    title.className = "tweak-title";
    title.textContent = tweak.title || tweak.id;
    const desc = document.createElement("div");
    desc.className = "tweak-desc";
    desc.textContent = tweak.description || "";

    info.appendChild(title);
    if (tweak.description) info.appendChild(desc);

    const switchWrap = document.createElement("label");
    switchWrap.className = "switch";
    const input = document.createElement("input");
    input.type = "checkbox";
    const slider = document.createElement("span");
    slider.className = "slider";

    const current = enabledMap[siteKey].hasOwnProperty(tweak.id) ? enabledMap[siteKey][tweak.id] : true;
    input.checked = Boolean(current);

    switchWrap.appendChild(input);
    switchWrap.appendChild(slider);

    row.appendChild(info);
    row.appendChild(switchWrap);
    li.appendChild(row);

    input.addEventListener("change", async (e) => {
      const newState = input.checked;
      enabledMap[siteKey] = enabledMap[siteKey] || {};
      enabledMap[siteKey][tweak.id] = newState;

      let reply = {};
      try {
        reply = await browser.runtime.sendMessage({
          action: "setEnabled",
          siteKey,
          tweakId: tweak.id,
          enabled: newState
        });
      } catch (err) {
        console.error("Failed to setEnabled", err);
      }

      if (reply && reply.needReload) {
        reloadBtn.classList.remove("hidden");
      }
    });

    return li;
  }

  for (const tweak of (meta.tweaks || [])) {
    const node = createTweakItem(tweak);
    tweaksList.appendChild(node);
  }

  reloadBtn.addEventListener("click", async () => {
    if (typeof tabId === "number") {
      try {
        await browser.runtime.sendMessage({ action: "reloadTab", tabId });
        reloadBtn.classList.add("hidden");
      } catch (e) {
        console.error("Reload request failed", e);
      }
    } else {
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
          await browser.runtime.sendMessage({ action: "reloadTab", tabId: tabs[0].id });
          reloadBtn.classList.add("hidden");
        }
      } catch (e) {
        console.error("Fallback reload failed", e);
      }
    }
  });

})();
