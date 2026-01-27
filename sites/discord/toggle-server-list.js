function waitForServerList() {
    const serverList = document.querySelector('div[aria-label*="Servers"]');
    if (!serverList) {
        setTimeout(waitForServerList, 500);
        return;
    }

    if (document.getElementById('toggle-server-list-btn')) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'toggle-server-list-btn';
    buttonContainer.className = 'listItem__650eb';
    buttonContainer.title = 'Toggle Servers List';
    buttonContainer.style.cursor = 'pointer';
    buttonContainer.dataset.collapsed = 'false';

    buttonContainer.innerHTML = `
        <div class="pill__5bc7e">
            <div class="wrapper__58105" aria-hidden="true"></div>
        </div>

        <span>
            <div class="listItemWrapper__91816">
                <div class="wrapper_cc5dd2" style="width: 40px; height: 40px">
                    <svg
                        width="48"
                        height="48"
                        viewBox="-4 -4 48 48"
                        class="svg_cc5dd2 shiftSVG_cc5dd2"
                        overflow="visible"
                        role="none"
                    >
                        <defs>
                            <path
                                d="M0 17.4545C0 11.3449 0 8.29005 1.18902 5.95647C2.23491 3.90379 3.90379 2.23491 5.95647 1.18902C8.29005 0 11.3449 0 17.4545 0H22.5455C28.6551 0 31.71 0 34.0435 1.18902C36.0962 2.23491 37.7651 3.90379 38.811 5.95647C40 8.29005 40 11.3449 40 17.4545V22.5455C40 28.6551 40 31.71 38.811 34.0435C37.7651 36.0962 36.0962 37.7651 34.0435 38.811C31.71 40 28.6551 40 22.5455 40H17.4545C11.3449 40 8.29005 40 5.95647 38.811C3.90379 37.7651 2.23491 36.0962 1.18902 34.0435C0 31.71 0 28.6551 0 22.5455V17.4545Z"
                                id="toggle-servers-mask"
                            />
                        </defs>

                        <mask id="toggle-servers" fill="black">
                            <use href="#toggle-servers-mask" fill="white"></use>
                        </mask>

                        <foreignObject mask="url(#toggle-servers)" x="0" y="0" width="40" height="40">
                            <div
                                class="circleIconButton__5bc7e"
                                aria-label="Toggle Servers List"
                                role="treeitem"
                                tabindex="-1"
                                aria-level="1"
                                data-list-item-id="guildsnav___toggle-servers"
                            >
                                <svg
                                    class="circleIcon__5bc7e toggle-chevron"
                                    aria-hidden="true"
                                    role="img"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        d="M8 10l4 4 4-4"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </svg>
                            </div>
                        </foreignObject>
                    </svg>
                </div>
            </div>
        </span>
    `;

    serverList.parentElement.insertBefore(buttonContainer, serverList);

    let visible = true;

    buttonContainer.addEventListener('click', () => {
        visible = !visible;
        serverList.style.display = visible ? '' : 'none';
        buttonContainer.dataset.collapsed = String(!visible);
    });

    const style = document.createElement('style');
    style.textContent = `
        #toggle-server-list-btn .toggle-chevron {
            transition: transform 0.2s ease;
        }
        #toggle-server-list-btn[data-collapsed="true"] .toggle-chevron {
            transform: rotate(180deg);
        }
    `;
    document.head.appendChild(style);
}

waitForServerList();