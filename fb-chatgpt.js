// ==UserScript==
// @name         Facebook ChatGPT
// @namespace    http://tampermonkey.net/
// @version      2024.05.22
// @description  Floating panel for collecting FB comments via adjacent Add Comment buttons, with drag, copy, reset, GPT prompts, and highlights
// @author       You
// @match        https://www.facebook.com/*
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
    'use strict';

    // --- Globals
    let thread = JSON.parse(localStorage.getItem('fb_thread_collector_thread') || '[]');
    let panelPos = JSON.parse(localStorage.getItem('fb_thread_collector_panel_pos') || '{"top":100,"left":100}');
    let panel, pill;

    // --- Utility
    function saveThread() {
        localStorage.setItem('fb_thread_collector_thread', JSON.stringify(thread));
    }
    function savePanelPos(top, left) {
        localStorage.setItem('fb_thread_collector_panel_pos', JSON.stringify({ top, left }));
    }
    function updatePill() {
        if (pill) pill.textContent = thread.length;
    }

    // --- Panel Creation
    function createPanel() {
        panel = document.createElement('div');
        panel.id = 'fb-thread-collector-panel';
        panel.style = `
            position: fixed;
            top: ${panelPos.top}px;
            left: ${panelPos.left}px;
            background: #23272f;
            color: #fff;
            z-index: 999999;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.35);
            padding: 18px 16px 14px 16px;
            min-width: 230px;
            min-height: 44px;
            user-select: none;
            font-size: 15px;
            font-family: system-ui,sans-serif;
            cursor: grab;
        `;

        // Drag handling
        let dragging = false, dragOffsetX = 0, dragOffsetY = 0;
        panel.addEventListener('mousedown', function (e) {
            if (e.target.closest('button')) return; // don’t drag when clicking buttons
            dragging = true;
            dragOffsetX = e.clientX - panel.offsetLeft;
            dragOffsetY = e.clientY - panel.offsetTop;
            panel.style.cursor = 'grabbing';
        });
        window.addEventListener('mousemove', function (e) {
            if (dragging) {
                panel.style.left = (e.clientX - dragOffsetX) + 'px';
                panel.style.top = (e.clientY - dragOffsetY) + 'px';
            }
        });
        window.addEventListener('mouseup', function () {
            if (dragging) {
                dragging = false;
                panel.style.cursor = 'grab';
                savePanelPos(panel.offsetTop, panel.offsetLeft);
            }
        });

        // --- CHECKBOX: Auto-open GPT tab ---
        let autoOpenGPT = localStorage.getItem('fb_thread_collector_auto_open_gpt') === 'true';
        const checkboxLabel = document.createElement('label');
        checkboxLabel.style = "margin-right:12px; cursor:pointer; font-size:13px; user-select: none; vertical-align: middle; display: inline-flex; align-items: center;";
        const checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.checked = autoOpenGPT;
        checkbox.style = "margin-right:5px; vertical-align: middle;";
        checkbox.onchange = function() {
            autoOpenGPT = checkbox.checked;
            localStorage.setItem('fb_thread_collector_auto_open_gpt', autoOpenGPT);
        };
        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(document.createTextNode("Auto-open GPT tab"));
        panel.appendChild(checkboxLabel);

        // --- COPY BUTTONS ---
        function getPostAndThreadArray() {
            const postMessage = document.querySelector('[role="dialog"] div[data-ad-rendering-role="story_message"]');
            let msg = '';
            if (postMessage) {
                msg = postMessage.innerText.trim();
            }
            const arr = [];
            if (msg) arr.push(msg);
            for (let i = thread.length - 1; i >= 0; i--) {
                arr.push(thread[i]);
            }
            return arr;
        }

        // Get Reply button
        const replyBtn = document.createElement('button');
        replyBtn.textContent = 'Get Reply';
        replyBtn.style = 'margin-right:12px;padding:4px 10px;border-radius:5px;background:#3484fa;color:white;border:none;cursor:pointer;font-size:14px;';
        replyBtn.onclick = () => {
            const arr = getPostAndThreadArray();
            const post = arr.length > 0 ? arr[0] : '';
            const threadArr = arr.slice(1);
            let out = `Write a comment reply (in Romanian) to this Facebook post and its comment thread. When generating a reply, do not include any of the comment author names.\n\nPost:\n${post}\n\nThread:`;
            if (threadArr.length > 0) {
                threadArr.forEach((c, i) => {
                    out += `\n${i + 1}. ${c}`;
                });
            } else {
                out += '\n(no comments selected)';
            }
            if (typeof GM_setClipboard === 'function') {
                GM_setClipboard(out, { type: 'text', mimetype: 'text/plain' });
            } else {
                navigator.clipboard.writeText(out);
            }
            replyBtn.textContent = 'Copied!';
            setTimeout(() => (replyBtn.textContent = 'Get Reply'), 1200);

            if (autoOpenGPT) {
                window.open('https://chatgpt.com/?temporary-chat=true&model=gpt-4o', '_blank');
            }
        };

        // Debunk button
        const debunkBtn = document.createElement('button');
        debunkBtn.textContent = 'Debunk';
        debunkBtn.style = 'margin-right:12px;padding:4px 10px;border-radius:5px;background:#c02942;color:white;border:none;cursor:pointer;font-size:14px;';
        debunkBtn.onclick = () => {
            const arr = getPostAndThreadArray();
            const post = arr.length > 0 ? arr[0] : '';
            const threadArr = arr.slice(1);
            let out = `Debunk this Facebook post and its comment thread and generate a comment reply in Romanian, not including any of the comment author names. Assume the post author means to spread disinformation and panic.\n\nPost:\n${post}\n\nThread:`;
            if (threadArr.length > 0) {
                threadArr.forEach((c, i) => {
                    out += `\n${i + 1}. ${c}`;
                });
            } else {
                out += '\n(no comments selected)';
            }
            if (typeof GM_setClipboard === 'function') {
                GM_setClipboard(out, { type: 'text', mimetype: 'text/plain' });
            } else {
                navigator.clipboard.writeText(out);
            }
            debunkBtn.textContent = 'Copied!';
            setTimeout(() => (debunkBtn.textContent = 'Debunk'), 1200);

            if (autoOpenGPT) {
                window.open('https://chatgpt.com/?temporary-chat=true&model=gpt-4o', '_blank');
            }
        };

        // Reset button with pill
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset';
        resetBtn.style = 'padding:4px 10px 4px 10px;border-radius:5px;background:#fa6a34;color:white;border:none;cursor:pointer;font-size:14px;';
        pill = document.createElement('span');
        pill.style = 'margin-left:7px;display:inline-block;vertical-align:middle;background:#222;color:white;border-radius:999px;padding:1px 8px;font-size:12px;';
        updatePill();
        resetBtn.appendChild(pill);
        resetBtn.onclick = () => {
            thread = [];
            saveThread();
            updatePill();
            rehighlightAllComments();
        };

        // --- Add controls to panel
        panel.appendChild(replyBtn);
        panel.appendChild(debunkBtn);
        panel.appendChild(resetBtn);

        // --- Insert to DOM
        document.body.appendChild(panel);
    }

    // --- Comment parsing (robust against decorators, keeps only main comment)
    function extractCommentText(replyBtn) {
        let commentContainer = replyBtn;
        for (let i = 0; i < 5; i++) {
            if (commentContainer.parentElement) {
                commentContainer = commentContainer.parentElement;
            } else {
                return null;
            }
        }
        if (!commentContainer || !commentContainer.childNodes || !commentContainer.childNodes[0]) return null;
        const commentBlock = commentContainer.childNodes[0];
        if (!commentBlock) return null;

        const author = commentBlock.querySelector('a[role="link"]')?.textContent.trim() || 'Unknown';
        const textBlock = commentBlock.innerText.trim();
        const text = textBlock
            .split('\n')
            .map(line => line.trim())
            .filter(line =>
                line &&
                line !== author &&
                !/^(Top fan|Author|Like|Reply|Just now|\d+[hm]|·)$/.test(line)
            )
            .join(' ');

        return `Author: ${author}\n${text}`;
    }

    // --- Add "Add Comment" buttons next to each Reply button (clone style!)
    function addChatGPTButton(replyBtn) {
        if (replyBtn.dataset.hasAddCommentBtn) return;
        replyBtn.dataset.hasAddCommentBtn = "1";

        // Clone the Reply button and adjust for Add Comment
        const addBtn = replyBtn.cloneNode(true);
        addBtn.textContent = 'Add Comment';
        addBtn.classList.add('gpt-add-comment-btn');
        addBtn.style.color = '#31a24c';  // Facebook green
        addBtn.style.marginLeft = '8px';
        addBtn.onclick = (e) => {
            e.stopPropagation();
            const parsed = extractCommentText(replyBtn);
            if (parsed) {
                if (thread.includes(parsed)) {
                    // Already in thread: scroll & highlight
                    highlightCommentByText(parsed);
                    return;
                }
                thread.push(parsed);
                saveThread();
                updatePill();
                rehighlightAllComments();
            } else {
                alert('Could not parse comment.');
            }
        };

        replyBtn.parentNode.insertBefore(addBtn, replyBtn.nextSibling);
    }

    // --- Re-highlight all comments after DOM changes or thread update
    function rehighlightAllComments() {
        const allReplyButtons = Array.from(document.querySelectorAll('div[role="button"]')).filter(el => el.textContent.trim() === 'Reply');
        for (const replyBtn of allReplyButtons) {
            let commentContainer = replyBtn;
            for (let i = 0; i < 5; i++) {
                if (commentContainer.parentElement) {
                    commentContainer = commentContainer.parentElement;
                } else {
                    continue;
                }
            }
            if (!commentContainer || !commentContainer.childNodes || !commentContainer.childNodes[0]) continue;
            const commentBlock = commentContainer.childNodes[0];
            if (!commentBlock) continue;

            const author = commentBlock.querySelector('a[role="link"]')?.textContent.trim() || 'Unknown';
            const textBlock = commentBlock.innerText.trim();
            const text = textBlock
                .split('\n')
                .map(line => line.trim())
                .filter(line =>
                    line &&
                    line !== author &&
                    !/^(Top fan|Author|Like|Reply|Just now|\d+[hm]|·)$/.test(line)
                )
                .join(' ');
            const displayText = `Author: ${author}\n${text}`;

            if (thread.includes(displayText)) {
                commentContainer.classList.add('gpt-comment-highlight');
            } else {
                commentContainer.classList.remove('gpt-comment-highlight');
            }
        }
    }

    // --- Scroll and highlight a specific comment
    function highlightCommentByText(commentText) {
        const allReplyButtons = Array.from(document.querySelectorAll('div[role="button"]')).filter(el => el.textContent.trim() === 'Reply');
        for (const replyBtn of allReplyButtons) {
            let commentContainer = replyBtn;
            for (let i = 0; i < 5; i++) {
                if (commentContainer.parentElement) {
                    commentContainer = commentContainer.parentElement;
                } else {
                    continue;
                }
            }
            if (!commentContainer || !commentContainer.childNodes || !commentContainer.childNodes[0]) continue;
            const commentBlock = commentContainer.childNodes[0];
            if (!commentBlock) continue;

            const author = commentBlock.querySelector('a[role="link"]')?.textContent.trim() || 'Unknown';
            const textBlock = commentBlock.innerText.trim();
            const text = textBlock
                .split('\n')
                .map(line => line.trim())
                .filter(line =>
                    line &&
                    line !== author &&
                    !/^(Top fan|Author|Like|Reply|Just now|\d+[hm]|·)$/.test(line)
                )
                .join(' ');
            const displayText = `Author: ${author}\n${text}`;

            if (displayText === commentText) {
                commentContainer.classList.add('gpt-comment-highlight');
                commentContainer.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }

    // --- Observe the DOM for dynamic loading of Reply buttons
    function observeReplies() {
        const observer = new MutationObserver(() => {
            const replyButtons = Array.from(document.querySelectorAll('div[role="button"]')).filter(el => el.textContent.trim() === 'Reply');
            replyButtons.forEach(addChatGPTButton);
            rehighlightAllComments();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Initial run
        setTimeout(() => {
            const replyButtons = Array.from(document.querySelectorAll('div[role="button"]')).filter(el => el.textContent.trim() === 'Reply');
            replyButtons.forEach(addChatGPTButton);
            rehighlightAllComments();
        }, 1000);
    }

    // --- Main
    createPanel();
    observeReplies();

    // --- Style for Add Comment button and highlighted comments
    const style = document.createElement('style');
    style.textContent = `
        .gpt-add-comment-btn:hover, .gpt-add-comment-btn:focus {
            background: rgba(49,162,76,0.12) !important;
        }
        .gpt-comment-highlight {
            outline: 2.5px solid #31a24c !important;
            background: rgba(49,162,76,0.07) !important;
            border-radius: 8px !important;
            transition: outline 0.2s, background 0.2s;
        }
    `;
    document.head.appendChild(style);

})();
