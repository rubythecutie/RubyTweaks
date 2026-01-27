async function loadJSON(path) {
  const url = browser.runtime.getURL(path);
  const res = await fetch(url);
  return res.json();
}

async function main() {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true
  });

  const hostname = new URL(tab.url).hostname;
  const list = document.getElementById("tweaks");

  const registry = await loadJSON("sites/registry.json");

  let found = false;

  for (const site of Object.values(registry)) {
    if (hostname.endsWith(site.domain)) {
      const meta = await loadJSON(site.meta);

      meta.tweaks.forEach(tweak => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${tweak.title}</strong>
          <div class="desc">${tweak.description}</div>
        `;
        list.appendChild(li);
      });

      found = true;
      break;
    }
  }

  if (!found) {
    list.innerHTML = "<li>No tweaks active 😴</li>";
  }
}

main();
