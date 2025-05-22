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
    let comments = [];
    let counter = 0;

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

    function displayTextBlock(text) {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.right = '10px';
        container.style.width = '300px';
        container.style.height = '400px';
        container.style.overflowY = 'auto';
        container.style.backgroundColor = 'white';
        container.style.border = '1px solid #ccc';
        container.style.padding = '10px';
        container.style.zIndex = '9999';
        container.style.fontFamily = 'sans-serif';
        container.style.fontSize = '14px';
        container.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.marginBottom = '10px';
        closeBtn.onclick = () => container.remove();

        const list = document.createElement('pre');
        list.textContent = text;
        list.style.whiteSpace = 'pre-wrap';
        list.style.wordWrap = 'break-word';
        list.style.fontFamily = 'monospace';
        list.style.fontSize = '12px';
        list.style.color = '#333';
        // scroll
        list.style.overflowY = 'auto';

        // Copy to clipboard
        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy';
        copyBtn.style.marginLeft = '10px';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text).then(() => {
                alert('Text copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        };
        container.appendChild(copyBtn);

        container.appendChild(closeBtn);
        container.appendChild(list);
        document.body.appendChild(container);
    }

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

    // === Search Comments Feature ===
    const searchCommentsRow = document.createElement('div');
    Object.assign(searchCommentsRow.style, {
        display: 'flex',
        width: '100%',
        gap: '6px'
    });

    const searchCommentsInput = document.createElement('input');
    searchCommentsInput.type = 'text';
    searchCommentsInput.placeholder = 'Search comments...';
    Object.assign(searchCommentsInput.style, {
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
    searchCommentsInput.addEventListener('click', e => e.stopPropagation());
    searchCommentsInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') searchCommentsBtn.click();
    });

    const searchCommentsBtn = document.createElement('button');
    searchCommentsBtn.textContent = 'Search';
    Object.assign(searchCommentsBtn.style, {
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

    // Change button color when searching
    searchCommentsBtn.addEventListener('click', () => {
        const query = searchCommentsInput.value.trim().toLowerCase();
        if (!query) return;

        let comments = [];
        let emptyChecks = 0;
        const MAX_EMPTY_CHECKS = 10;
        let foundQueryText = false;

        function consumeComment(comment) {
            const text = comment.innerText.trim();
            comments.push(text);

            // Check if 
            if (text.toLowerCase().includes(query.toLowerCase())) {
                foundQueryText = true;
                searchCommentsBtn.style.background = '#4CAF50'; // Reset button color
                searchCommentsBtn.textContent = 'Search';
                searchCommentsBtn.disabled = false; // Enable button
                searchCommentsInput.value = ''; // Clear input
                searchCommentsInput.focus(); // Refocus input
                console.log('Found comment:', text);
                // Optionally, you can highlight the comment or do something else
                comment.style.backgroundColor = '#ffeb3b'; // Highlight found comment
                return;
            }

            const parent = comment.closest('div:not([class])');
            if (parent) parent.remove();
        }

        function getNextComment() {
            return document.querySelector('div[role="dialog"] div[aria-label^="Comment"][role="article"]');
        }

        function processNext() {
            if (foundQueryText) {
                // Stop processing if we found the query text

                searchCommentsBtn.style.background = '#4CAF50'; // Reset button color
                searchCommentsBtn.textContent = 'Search';
                searchCommentsBtn.disabled = false; // Enable button
                return;
            }

            const comment = getNextComment();
            if (!comment) {
                if (emptyChecks++ < MAX_EMPTY_CHECKS) {
                    setTimeout(processNext, 500);
                } else {
                    console.log('Finished processing comments.');
                }
                return;
            }

            emptyChecks = 0;

            const seeMore = Array.from(comment.querySelectorAll('div[role="button"]'))
                .find(button => {
                    const text = button.textContent.trim();
                    return text === 'See more' || text === 'Afișează mai mult';
                });

            if (!seeMore) {
                consumeComment(comment);
                setTimeout(processNext, 100);
                return;
            }

            const key = Object.keys(seeMore).find(k => k.startsWith('__reactProps$'));
            if (!key || typeof seeMore[key]?.onClick !== 'function') {
                console.warn('No React onClick found for See more:', seeMore);
                consumeComment(comment);
                setTimeout(processNext, 100);
                return;
            }

            const observer = new MutationObserver(() => {
                observer.disconnect();
                consumeComment(comment);
                setTimeout(processNext, 100);
            });

            observer.observe(comment, { childList: true, subtree: true, characterData: true });

            seeMore[key].onClick({
                type: 'click',
                nativeEvent: new MouseEvent('click'),
                currentTarget: seeMore,
                target: seeMore,
                stopPropagation() { },
                preventDefault() { }
            });
        }

        processNext();
    });


    searchCommentsRow.appendChild(searchCommentsInput);
    searchCommentsRow.appendChild(searchCommentsBtn);
    taskbar.appendChild(searchCommentsRow);

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

    // === Button 4: Scrape Top Comments ===
    function runScrapeLogic() {
        const commentElements = Array.from(document.querySelectorAll('div[role="dialog"] div[aria-label^="Comment"][role="article"]'));
        let index = 0;
        const expanded = [];

        counter++;
        console.log('Scrape Top Comments clicked:', counter);
        // let comments = [];

        function expandNext() {
            if (index >= commentElements.length) {
                scrapeComments();
                return;
            }

            const comment = commentElements[index++];
            const seeMore = Array.from(comment.querySelectorAll('div[role="button"]'))
                .find(button => {
                    const text = button.textContent.trim();
                    return text === 'See more' || text === 'Afișează mai mult';
                });

            if (!seeMore) {
                expanded.push(comment);
                expandNext();
                return;
            }

            const key = Object.keys(seeMore).find(k => k.startsWith('__reactProps$'));
            if (!key || typeof seeMore[key]?.onClick !== 'function') {
                console.warn('No React onClick found for "See more" button:', seeMore);
                expanded.push(comment);
                expandNext();
                return;
            }

            const observer = new MutationObserver(() => {
                observer.disconnect();
                expanded.push(comment);
                expandNext();
            });

            observer.observe(comment, {
                childList: true,
                subtree: true,
                characterData: true,
            });

            seeMore[key].onClick({
                type: 'click',
                nativeEvent: new MouseEvent('click'),
                currentTarget: seeMore,
                target: seeMore,
                stopPropagation() { },
                preventDefault() { }
            });
        }

        function scrapeComments() {
            const updatedComments = Array.from(document.querySelectorAll('div[role="dialog"] div[aria-label^="Comment"][role="article"]'));
            Array.from(updatedComments).forEach(comment => {
                comments.push(comment.innerText.trim());
            });

            // const topComments = updatedComments.map(comment => comment.innerText.trim()).join('\n\n');
            // console.log('Top Comments:', topComments);
            // console.log('Top Comments:', comments.join('\n\n'));
            console.log(comments);
            console.log(`Found ${comments.length} comments.`);
            // Hide all updatedComments' parent elements (div with no class) ` elements.forEach(el => el.style.display = 'none');`
            updatedComments.forEach(comment => {
                const parent = comment.closest('div:not([class])');
                if (parent) {
                    // Delete the parent element
                    parent.remove();
                    // parent.style.display = 'none';

                }
            });
        }

        expandNext();
    }

    taskbar.appendChild(createButton('Scrape Top Comments', runScrapeLogic));

    // === Add Scrape Loop Button ===
    function runScrapeLoop() {
        let comments = [];
        let counter = 0;
        let emptyChecks = 0;
        const MAX_EMPTY_CHECKS = 10;

        counter++;
        console.log('Scrape Top Comments clicked:', counter);

        function consumeComment(comment) {
            comments.push(comment.innerText.trim());
            const parent = comment.closest('div:not([class])');
            if (parent) {
                parent.remove();
            }

            // Every 10 comments, log the progress
            if (comments.length % 10 === 0) {
                console.log(`Processed ${comments.length} comments...`);
            }
        }

        function getNextComment() {
            return document.querySelector('div[role="dialog"] div[aria-label^="Comment"][role="article"]');
        }

        function processNext() {
            const comment = getNextComment();
            if (!comment) {
                if (emptyChecks++ < MAX_EMPTY_CHECKS) {
                    setTimeout(processNext, 500); // wait longer for late content
                } else {
                    console.log('Finished processing comments.');
                    console.log(comments);
                    displayTextBlock(JSON.stringify(comments, null, 2));
                }
                return;
            }

            emptyChecks = 0; // reset if we found a comment

            const seeMore = Array.from(comment.querySelectorAll('div[role="button"]'))
                .find(button => {
                    const text = button.textContent.trim();
                    return text === 'See more' || text === 'Afișează mai mult';
                });

            if (!seeMore) {
                consumeComment(comment);
                setTimeout(processNext, 200);
                return;
            }

            const key = Object.keys(seeMore).find(k => k.startsWith('__reactProps$'));
            if (!key || typeof seeMore[key]?.onClick !== 'function') {
                console.warn('No React onClick found for "See more" button:', seeMore);
                consumeComment(comment);
                setTimeout(processNext, 200);
                return;
            }

            const observer = new MutationObserver(() => {
                observer.disconnect();
                consumeComment(comment);
                setTimeout(processNext, 200);
            });

            observer.observe(comment, {
                childList: true,
                subtree: true,
                characterData: true,
            });

            seeMore[key].onClick({
                type: 'click',
                nativeEvent: new MouseEvent('click'),
                currentTarget: seeMore,
                target: seeMore,
                stopPropagation() { },
                preventDefault() { }
            });
        }

        // Start the processing loop
        processNext();
    }

    taskbar.appendChild(createButton('Scrape All Comments', runScrapeLoop));

})();
