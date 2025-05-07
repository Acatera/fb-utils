// ==UserScript==
// @name         Floating Taskbar (with Search Box)
// @namespace    http://yourname.dev/
// @version      1.3
// @description  Draggable taskbar with search box and buttons for comment tools on Facebook pages, with clean layout and input alignment improvements.
// @author       You
// @match        *://*.facebook.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // === Create the taskbar ===
    const taskbar = document.createElement('div');
    taskbar.id = 'custom-taskbar';
    taskbar.style.position = 'fixed';
    taskbar.style.top = '20px';
    taskbar.style.left = '20px';
    taskbar.style.width = '220px';
    taskbar.style.zIndex = '9999';
    taskbar.style.background = 'rgba(0, 0, 0, 0.85)';
    taskbar.style.color = '#fff';
    taskbar.style.padding = '10px';
    taskbar.style.fontFamily = 'sans-serif';
    taskbar.style.display = 'flex';
    taskbar.style.flexDirection = 'column';
    taskbar.style.gap = '10px';
    taskbar.style.alignItems = 'stretch';
    taskbar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
    taskbar.style.borderRadius = '8px';
    taskbar.style.cursor = 'move';
    taskbar.style.userSelect = 'none';
    document.body.appendChild(taskbar);

    // === Make taskbar draggable ===
    (function makeDraggable(el) {
        let isDragging = false;
        let offsetX = 0, offsetY = 0;

        el.addEventListener('mousedown', function (e) {
            isDragging = true;
            offsetX = e.clientX - el.offsetLeft;
            offsetY = e.clientY - el.offsetTop;
            el.style.transition = 'none';
        });

        document.addEventListener('mousemove', function (e) {
            if (isDragging) {
                el.style.left = (e.clientX - offsetX) + 'px';
                el.style.top = (e.clientY - offsetY) + 'px';
            }
        });

        document.addEventListener('mouseup', function () {
            isDragging = false;
        });
    })(taskbar);

    function createButton(text, onClick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.padding = '6px 12px';
        btn.style.border = 'none';
        btn.style.borderRadius = '4px';
        btn.style.background = '#4CAF50';
        btn.style.color = '#fff';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '14px';
        btn.style.fontWeight = 'bold';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick();
        });
        return btn;
    }

    // === Search input and button (aligned inline) ===
    const searchRow = document.createElement('div');
    Object.assign(searchRow.style, {
        display: 'flex',
        width: '100%',
        gap: '6px'
    });

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search antidezinfo.ro';
    Object.assign(searchInput.style, {
        padding: '0 8px',
        height: '36px',
        width: '100%',
        lineHeight: '36px',
        fontSize: '14px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        outline: 'none',
        flex: '1',
        boxSizing: 'border-box'
    });
    searchInput.addEventListener('click', e => e.stopPropagation());
    searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') searchBtn.click();
    });

    const searchBtn = document.createElement('button');
    searchBtn.textContent = 'Go';
    Object.assign(searchBtn.style, {
        height: '36px',
        lineHeight: '36px',
        padding: '0 12px',
        fontSize: '13px',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '4px',
        background: '#4CAF50',
        color: '#fff',
        cursor: 'pointer',
        flexShrink: '0'
    });
    searchBtn.addEventListener('click', () => {
        const query = encodeURIComponent(searchInput.value.trim());
        if (query) {
            window.open(`https://www.antidezinfo.ro/?s=${query}`, '_blank');
        }
    });

    searchRow.appendChild(searchInput);
    searchRow.appendChild(searchBtn);
    taskbar.appendChild(searchRow);

    // === Button 1: Sort Comments ===
    function runSortLogic() {
        function clickReactByTextSequence(items, delay = 500) {
            let i = 0;
            function clickNext() {
                if (i >= items.length) return;
                const [selector, text] = items[i++];
                const el = Array.from(document.querySelectorAll(selector))
                    .find(e => e.textContent.includes(text));
                if (!el) return console.warn(`Element "${text}" not found`);
                const key = Object.keys(el).find(k => k.startsWith('__reactProps$'));
                if (!key || !el[key]?.onClick) return console.warn(`React onClick for "${text}" not found`);
                el[key].onClick({
                    type: 'click',
                    nativeEvent: new MouseEvent('click'),
                    currentTarget: el,
                    target: el,
                    stopPropagation() { },
                    preventDefault() { }
                });
                setTimeout(clickNext, delay);
            }
            clickNext();
        }

        clickReactByTextSequence([
            ['div[aria-haspopup="menu"][role="button"]', 'Most relevant'],
            ['[role="menuitem"]', 'All comments']
        ], 800);
    }
    taskbar.appendChild(createButton('Show All Comments', runSortLogic));

    // === Button 2: Expand Replies ===
    function runExpandLogic() {
        const buttons = Array.from(document.querySelectorAll('div[role="button"]'))
            .filter(e =>
                e.textContent.includes("Replies") ||
                e.textContent.includes("replied") ||
                e.textContent.includes("View all") ||
                e.textContent.includes("View 1 reply")
            );

        buttons.forEach((el, i) => {
            setTimeout(() => {
                const key = Object.keys(el).find(k => k.startsWith('__reactProps$'));
                if (key && el[key]?.onClick) {
                    el[key].onClick({
                        type: 'click',
                        nativeEvent: new MouseEvent('click'),
                        currentTarget: el,
                        target: el,
                        stopPropagation() { },
                        preventDefault() { }
                    });
                } else {
                    console.warn('No React onClick found for element:', el);
                }
            }, i * 100);
        });
    }
    taskbar.appendChild(createButton('Expand Replies', runExpandLogic));

    // === Button 3: Scroll Comments ===
    function runScrollLogic() {
        (function () {
            const containerSelectorBase = '[role="dialog"][aria-labelledby] > div > div > div';
            let containerSelector = containerSelectorBase;

            function waitForContainer(callback) {
                const interval = setInterval(() => {
                    let el = document.querySelector(containerSelector)?.children[1];
                    if (!el) {
                        containerSelector += ' > div';
                    }
                    if (el) {
                        clearInterval(interval);
                        callback(el);
                    }
                }, 500);
            }

            waitForContainer(function (container) {
                console.log('Comment container found:', container);
                container.scrollBy({
                    top: container.clientHeight * .75,
                    behavior: 'smooth'
                });

                setTimeout(() => {
                    console.log('Single scroll complete.');
                    if (window.chrome?.webview?.postMessage) {
                        window.chrome.webview.postMessage('scrolling_done');
                    }
                }, 500);
            });
        })();
    }
    taskbar.appendChild(createButton('Scroll Comments', runScrollLogic));

})();
