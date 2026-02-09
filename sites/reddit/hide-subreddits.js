const STORAGE_KEY = 'hiddenSubreddits';
const BUTTON_INSERT_SELECTOR = 'header.v2.bg-neutral-background nav div.ps-lg > div.flex:first-of-type';

function getHidden() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(r || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveHidden(a) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  updateButtonCount();
  applyHides();
}

function normalizeInput(s) {
  if (!s) return null;
  s = s.trim().toLowerCase();
  s = s.replace(/^\/?r\//, '');
  s = s.replace(/\s+/g, '');
  if (!s) return null;
  return `r/${s}`;
}

function createHeaderButton() {
  const wrapper = document.createElement('span');
  wrapper.setAttribute('data-part', 'hide-subreddits');
  wrapper.className = 'contents';
  wrapper.style.cursor = 'pointer';

  const rel = document.createElement('div');
  rel.className = 'relative w-[40px] h-[40px]';

  const a = document.createElement('a');
  a.className = 'flex-shrink-0 button-medium px-[calc(var(--rem12)-var(--button-border-width,0px))] button-plain icon items-center justify-center button inline-flex';
  a.setAttribute('role', 'button');
  a.title = 'Hide subreddits';
  
  a.innerHTML = `
    <span class="flex items-center justify-center">
      <span class="flex">
        <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path>
          <path d="M2 4.27L3.27 3 21 20.73 19.73 22 2 4.27z" fill="currentColor" stroke="var(--color-neutral-background)" stroke-width="0.5"></path>
        </svg>
      </span>
    </span>`;

  const badgeContainer = document.createElement('div');
  badgeContainer.id = 'hider-badge-container';
  badgeContainer.className = 'absolute top-0 end-0 pointer-events-none';
  
  rel.appendChild(a);
  rel.appendChild(badgeContainer);
  wrapper.appendChild(rel);

  a.addEventListener('click', e => {
    e.preventDefault();
    openModal();
  });

  return wrapper;
}

function updateButtonCount() {
  const count = getHidden().length;
  const container = document.getElementById('hider-badge-container');
  if (container) {
    container.innerHTML = '';
    if (count > 0) {
      const badge = document.createElement('dynamic-badge');
      badge.setAttribute('initial-count', count);
      badge.setAttribute('appearance', 'ALERT');
      badge.setAttribute('data-id', 'notification-count-element');
      container.appendChild(badge);
    }
  }

  window.dispatchEvent(new CustomEvent('subreddit_hider_count_changed', {
    detail: { count: count }
  }));
}

let modalEl = null;
function openModal() {
  if (modalEl) {
    modalEl.style.display = 'flex';
    const input = modalEl.querySelector('input');
    if (input) input.focus();
    return;
  }

  modalEl = document.createElement('div');
  modalEl.className = 'rpl-dialog';
  modalEl.id = 'hide-subreddits-modal';
  modalEl.style.position = 'fixed';
  modalEl.style.inset = '0';
  modalEl.style.zIndex = '2147483647';
  modalEl.style.display = 'flex';
  modalEl.style.alignItems = 'center';
  modalEl.style.justifyContent = 'center';
  modalEl.style.background = 'rgba(0,0,0,0.45)';

  const modalCard = document.createElement('rpl-modal-card');
  modalCard.className = 'box-border h-[480px] w-[584px] max-w-full';
  modalCard.setAttribute('appearance', 'modal');

  const titleSlot = document.createElement('div');
  titleSlot.setAttribute('slot', 'title');
  titleSlot.className = 'flex items-center justify-between h-[var(--rem32)]';
  titleSlot.innerHTML = `<span class="header-title" style="font-weight: 600;">Hide subreddits</span>`;

  const closeSlot = document.createElement('div');
  closeSlot.setAttribute('slot', 'close-button');
  const closeBtn = document.createElement('button');
  closeBtn.className = 'button-small px-[calc(var(--rem10)-var(--button-border-width,0px))] button-secondary icon items-center justify-center button inline-flex';
  closeBtn.innerHTML = `<span class="flex items-center justify-center"><span class="flex"><svg fill="currentColor" height="16" viewBox="0 0 20 20" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M11.273 10l5.363-5.363a.9.9 0 10-1.273-1.273L10 8.727 4.637 3.364a.9.9 0 10-1.273 1.273L8.727 10l-5.363 5.363a.9.9 0 101.274 1.273L10 11.273l5.363 5.363a.897.897 0 001.274 0 .9.9 0 000-1.273L11.275 10h-.002z"></path></svg></span></span>`;
  closeBtn.onclick = () => {
    modalEl.style.display = 'none';
  };
  closeSlot.appendChild(closeBtn);
  
  modalCard.appendChild(titleSlot);
  modalCard.appendChild(closeSlot);

  const contentWrapper = document.createElement('div');
  contentWrapper.style.padding = '16px 24px'; 
  contentWrapper.style.display = 'flex';
  contentWrapper.style.flexDirection = 'column';
  contentWrapper.style.height = '100%';
  contentWrapper.style.boxSizing = 'border-box';

  const inputRow = document.createElement('div');
  inputRow.className = 'flex gap-3 mb-8 items-stretch w-full h-[40px]';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'subreddit or r/subreddit';
  input.className = 'flex-1 rounded-[24px] px-5 bg-[var(--color-neutral-background-selected)] border border-transparent focus:border-[var(--color-primary-background)] outline-none text-tone-1 text-[14px] h-full';
  input.style.minWidth = '0';
  input.style.marginRight = "5px";
  input.onkeydown = (e) => {
    e.stopPropagation(); 
    if (e.key === 'Enter') addFromInput();
  };

  const addBtn = document.createElement('button');
  addBtn.className = 'button-medium button-primary rounded-full px-6 flex-shrink-0 inline-flex items-center justify-center';
  addBtn.style.minWidth = '70px';
  addBtn.textContent = 'Add';
  addBtn.onclick = addFromInput;

  inputRow.append(input, addBtn);

  const list = document.createElement('div');
  list.className = 'flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col';
  list.style.marginTop = "10px";
  list.style.maxHeight = '320px';

  function renderList() {
    const arr = getHidden();
    list.innerHTML = '';
    if (!arr.length) {
      list.innerHTML = `<div class="text-tone-3 py-16 text-center text-[14px]">No subreddits hidden yet.</div>`;
      return;
    }
    arr.forEach(item => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between py-3 px-2 mb-2'; // Added mb-2 for vertical gap
      row.style.marginTop = "5px";
      row.innerHTML = `<span class="text-[14px] text-tone-1 font-semibold">${item}</span>`;
      
      const delBtn = document.createElement('button');
      delBtn.className = 'button-small button-secondary rounded-full';
      delBtn.style.paddingLeft = "10px";
      delBtn.style.paddingRight = "10px";
      delBtn.style.fontSize = '12px';
      delBtn.textContent = 'Remove';
      delBtn.onclick = () => {
        saveHidden(getHidden().filter(x => x !== item));
        renderList();
      };
      
      row.appendChild(delBtn);
      list.appendChild(row);
    });
  }

  function addFromInput() {
    const v = normalizeInput(input.value);
    if (!v) return;
    const arr = getHidden();
    if (!arr.includes(v)) {
      arr.push(v);
      saveHidden(arr);
      renderList();
    }
    input.value = '';
    input.focus();
  }

  contentWrapper.append(inputRow, list);
  modalCard.appendChild(contentWrapper);
  modalEl.appendChild(modalCard);
  document.body.appendChild(modalEl);
  renderList();
  
  setTimeout(() => input.focus(), 100);
}

function applyHides() {
  const hiddenSet = new Set(getHidden().map(x => x.toLowerCase()));
  const posts = document.querySelectorAll('shreddit-post, article.w-full');
  posts.forEach(post => {
    const sub = post.getAttribute('subreddit-prefixed-name');
    if (sub && hiddenSet.has(sub.toLowerCase())) {
      post.style.display = 'none';
      post.dataset.hiddenByHider = 'true';
    } else if (post.dataset.hiddenByHider) {
      post.style.display = '';
      delete post.dataset.hiddenByHider;
    }
  });
}

function ensureInsertOnce() {
  if (document.querySelector('[data-part="hide-subreddits"]')) return;
  const container = document.querySelector(BUTTON_INSERT_SELECTOR);
  if (!container) return;

  const btn = createHeaderButton();
  const chatIcon = container.querySelector('span[data-part="chat"]');
  if (chatIcon) {
    container.insertBefore(btn, chatIcon);
  } else {
    container.appendChild(btn);
  }
  updateButtonCount();
}

const observer = new MutationObserver(() => {
  ensureInsertOnce();
  applyHides();
});

observer.observe(document.body, { childList: true, subtree: true });
ensureInsertOnce();
applyHides();