// ==UserScript==
// @name         Facebook ChatGPT
// @namespace    http://tampermonkey.net/
// @version      2024.05.22
// @description  Floating panel for collecting FB comments via adjacent Add Comment buttons, with drag, copy, reset, GPT prompts & highlights; hidden by default and toggled via a ChatGPT-style icon in the banner row. Includes advanced TTS controls.
// @author       You
// @match        https://www.facebook.com/*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // --- State
    let thread = JSON.parse(localStorage.getItem('fb_thread_collector_thread') || '[]');
    let panelPos = JSON.parse(localStorage.getItem('fb_thread_collector_panel_pos') || '{"top":100,"left":100}');
    let panel, pill;
    let ttsLang = localStorage.getItem('fb_thread_collector_tts_lang') || 'ro-RO';

    function saveThread() {
        localStorage.setItem('fb_thread_collector_thread', JSON.stringify(thread));
    }
    function savePanelPos(top, left) {
        localStorage.setItem('fb_thread_collector_panel_pos', JSON.stringify({ top, left }));
    }
    function updatePill() {
        if (pill) pill.textContent = thread.length;
    }

    // --- Build Floating Panel ---
    function createPanel() {
        if (panel && panel.parentNode) return; // Avoid double-creating

        panel = document.createElement('div');
        panel.id = 'fb-thread-collector-panel';
        panel.style.cssText = `
            position: fixed;
            top: ${panelPos.top}px;
            left: ${panelPos.left}px;
            background: #23272f;
            color: #fff;
            z-index: 999999;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.35);
            padding: 18px 16px 14px;
            min-width: 230px;
            min-height: 44px;
            user-select: none;
            font: 15px system-ui,sans-serif;
            cursor: grab;
            display: none;
        `;

        // Drag handling
        let dragging = false, dx = 0, dy = 0;
        panel.addEventListener('mousedown', e => {
            if (e.target.closest('button') || e.target.closest('select')) return;
            dragging = true;
            dx = e.clientX - panel.offsetLeft;
            dy = e.clientY - panel.offsetTop;
            panel.style.cursor = 'grabbing';
        });
        window.addEventListener('mousemove', e => {
            if (!dragging) return;
            panel.style.left = (e.clientX - dx) + 'px';
            panel.style.top  = (e.clientY - dy) + 'px';
        });
        window.addEventListener('mouseup', () => {
            if (!dragging) return;
            dragging = false;
            panel.style.cursor = 'grab';
            savePanelPos(panel.offsetTop, panel.offsetLeft);
        });

        // Auto-open GPT checkbox
        let autoOpen = localStorage.getItem('fb_thread_collector_auto_open_gpt') === 'true';
        const cbLabel = document.createElement('label');
        cbLabel.style.cssText = 'margin-right:12px; cursor:pointer; font-size:13px; user-select:none; display:inline-flex; align-items:center;';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = autoOpen;
        cb.style.marginRight = '5px';
        cb.onchange = () => {
            autoOpen = cb.checked;
            localStorage.setItem('fb_thread_collector_auto_open_gpt', autoOpen);
        };
        cbLabel.append(cb, document.createTextNode('Auto-open GPT tab'));
        panel.appendChild(cbLabel);

        // Helpers
        function getContext() {
            const msgEl = document.querySelector('[role="dialog"] div[data-ad-rendering-role="story_message"]');
            const post = msgEl ? msgEl.innerText.trim() : '';
            const arr = post ? [post] : [];
            for (let i = thread.length - 1; i >= 0; i--) arr.push(thread[i]);
            return arr;
        }
        function copyPrompt(template) {
            const ctx = getContext();
            let out = template + '\n\nPost:\n' + (ctx[0] || '') + '\n\nThread:';
            if (ctx.length > 1) {
                ctx.slice(1).forEach((c, i) => out += `\n${i+1}. ${c}`);
            } else {
                out += '\n(no comments selected)';
            }
            const clip = typeof GM_setClipboard === 'function'
            ? text => GM_setClipboard(text, { type: 'text', mimetype: 'text/plain' })
            : text => navigator.clipboard.writeText(text);
            clip(out);
        }

        // “Get Reply”
        const replyBtn = document.createElement('button');
        replyBtn.textContent = 'Get Reply';
        replyBtn.style.cssText = 'margin-right:12px;padding:4px 10px;border-radius:5px;background:#3484fa;color:#fff;border:none;cursor:pointer;font-size:14px;';
        replyBtn.onclick = () => {
            copyPrompt('Write a comment reply (in Romanian) to this Facebook post and its comment thread. Do not include any author names.');
            replyBtn.textContent = 'Copied!';
            setTimeout(() => replyBtn.textContent = 'Get Reply', 1200);
            if (autoOpen) window.open('https://chatgpt.com/?temporary-chat=true&model=gpt-4o', '_blank');
        };
        panel.appendChild(replyBtn);

        // “Debunk”
        const debunkBtn = document.createElement('button');
        debunkBtn.textContent = 'Debunk';
        debunkBtn.style.cssText = 'margin-right:12px;padding:4px 10px;border-radius:5px;background:#c02942;color:#fff;border:none;cursor:pointer;font-size:14px;';
        debunkBtn.onclick = () => {
            copyPrompt('Debunk this Facebook post and its comment thread and generate a comment reply in Romanian. Assume disinformation intent. Do not include any author names.');
            debunkBtn.textContent = 'Copied!';
            setTimeout(() => debunkBtn.textContent = 'Debunk', 1200);
            if (autoOpen) window.open('https://chatgpt.com/?temporary-chat=true&model=gpt-4o', '_blank');
        };
        panel.appendChild(debunkBtn);

        // Reset + pill
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset';
        resetBtn.style.cssText = 'padding:4px 10px;border-radius:5px;background:#fa6a34;color:#fff;border:none;cursor:pointer;font-size:14px;';
        pill = document.createElement('span');
        pill.style.cssText = 'margin-left:7px;background:#222;color:#fff;border-radius:999px;padding:1px 8px;font-size:12px;';
        updatePill();
        resetBtn.appendChild(pill);
        resetBtn.onclick = () => {
            thread = [];
            saveThread();
            updatePill();
            rehighlightAllComments();
        };
        panel.appendChild(resetBtn);

        // --- TTS Controls on new row ---
        const ttsRow = document.createElement('div');
        ttsRow.style.cssText = 'margin-top:14px;display:flex;align-items:center;gap:8px;';

        // Dropdown language selector
        const langSelect = document.createElement('select');
        langSelect.style.cssText = 'padding:2px 6px;border-radius:4px;border:none;background:#222;color:#fff;font-size:13px;';
        [
            { value: 'ro-RO', label: 'Română (RO)' },
            { value: 'en-US', label: 'English (EN)' },
        ].forEach(opt => {
            const o = document.createElement('option');
            o.value = opt.value;
            o.textContent = opt.label;
            langSelect.appendChild(o);
        });
        langSelect.value = ttsLang;
        langSelect.onchange = () => {
            ttsLang = langSelect.value;
            localStorage.setItem('fb_thread_collector_tts_lang', ttsLang);
        };
        ttsRow.appendChild(langSelect);

        // Speak Clipboard or Selection Button
        const speakBtn = document.createElement('button');
        speakBtn.textContent = '🔊 Citește';
        speakBtn.style.cssText = 'padding:4px 10px;border-radius:5px;background:#555;color:#fff;border:none;cursor:pointer;font-size:14px;';
        speakBtn.onclick = async () => {
            try {
                let text = window.getSelection().toString();
                if (!text.trim()) {
                    text = await navigator.clipboard.readText();
                }
                if (!text.trim()) return alert('Niciun text selectat și clipboardul este gol.');

                // Find suitable voice
                const synth = window.speechSynthesis;
                let voices = synth.getVoices();
                if (!voices.length) {
                    await new Promise(res => {
                        window.speechSynthesis.onvoiceschanged = res;
                    });
                    voices = synth.getVoices();
                }
                let voce = voices.find(v => v.lang === ttsLang) ||
                           voices.find(v => v.lang.startsWith(ttsLang.split('-')[0]));
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = ttsLang;
                if (voce) utterance.voice = voce;
                utterance.rate = 1.5;
                utterance.pitch = 1;
                synth.speak(utterance);
            } catch (err) {
                console.error('Eroare la citirea selecției sau clipboardului:', err);
                alert('Nu pot accesa textul selectat sau clipboardul.');
            }
        };
        ttsRow.appendChild(speakBtn);

        // Stop TTS Button
        const stopBtn = document.createElement('button');
        stopBtn.textContent = '■ Oprește';
        stopBtn.style.cssText = 'padding:4px 10px;border-radius:5px;background:#999;color:#fff;border:none;cursor:pointer;font-size:14px;';
        stopBtn.onclick = () => {
            window.speechSynthesis.cancel();
        };
        ttsRow.appendChild(stopBtn);

        panel.appendChild(ttsRow);

        document.body.appendChild(panel);
    }

    // --- Comment extraction & Add-comment buttons ---
    function extractComment(btn) {
        let node = btn;
        for (let i = 0; i < 5; i++) {
            node = node.parentElement;
            if (!node) return null;
        }
        const block = node.childNodes[0];
        if (!block) return null;
        const author = block.querySelector('a[role="link"]')?.textContent.trim() || 'Unknown';
        const text = block.innerText.split('\n')
        .map(l => l.trim())
        .filter(l => l && l !== author && !/^(Top fan|Author|Like|Reply|Just now|\d+[hm]|·)$/.test(l))
        .join(' ');
        return `Author: ${author}\n${text}`;
    }

    function addCommentBtns() {
        document.querySelectorAll('div[role="button"]').forEach(btn => {
            if (btn.textContent.trim() === 'Reply' && !btn.dataset.gptInit) {
                btn.dataset.gptInit = '1';
                const clone = btn.cloneNode(true);
                clone.textContent = 'Add Comment';
                clone.classList.add('gpt-add-comment-btn');
                clone.style.cssText = 'margin-left:8px;color:#31a24c;cursor:pointer';
                clone.onclick = e => {
                    e.stopPropagation();
                    const txt = extractComment(btn);
                    if (!txt) return alert('Could not parse comment.');
                    if (thread.includes(txt)) {
                        highlightByText(txt);
                    } else {
                        thread.push(txt);
                        saveThread();
                        updatePill();
                        rehighlightAllComments();
                    }
                };
                btn.parentNode.insertBefore(clone, btn.nextSibling);
            }
        });
    }

    function rehighlightAllComments() {
        document.querySelectorAll('div[role="button"]').forEach(btn => {
            if (btn.textContent.trim() !== 'Reply') return;
            const txt = extractComment(btn);
            let node = btn;
            for (let i = 0; i < 5; i++) node = node.parentElement;
            if (!node) return;
            node.classList.toggle('gpt-comment-highlight', thread.includes(txt));
        });
    }

    function highlightByText(txt) {
        for (const btn of document.querySelectorAll('div[role="button"]')) {
            if (btn.textContent.trim() !== 'Reply') continue;
            if (extractComment(btn) === txt) {
                let node = btn;
                for (let i = 0; i < 5; i++) node = node.parentElement;
                if (node) {
                    node.classList.add('gpt-comment-highlight');
                    node.scrollIntoView({ behavior:'smooth', block:'center' });
                }
                break;
            }
        }
    }

    function observeComments() {
        const mo = new MutationObserver(() => {
            addCommentBtns();
            rehighlightAllComments();
        });
        mo.observe(document.body, { childList:true, subtree:true });
        setTimeout(() => {
            addCommentBtns();
            rehighlightAllComments();
        }, 1000);
    }

    // --- Inject & persist ChatGPT-style toggle icon ---
    function injectToggleWatcher() {
        setTimeout(injectToggleWatcher, 1000);
        const banner = document.querySelector('div[role="banner"]');
        if (!banner) return;
        const container = banner.lastElementChild?.firstElementChild;
        if (!container) return setTimeout(injectToggleWatcher, 1000);

        function ensureTile() {
            if (document.getElementById('fb-thread-collector-toggle')) return;
            const tile = document.createElement('div');
            tile.id = 'fb-thread-collector-toggle';
            tile.innerHTML = `
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style="display:block">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2zm0 18
              a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/>
            <path d="M7 12l5-4v8l-5-4z"/>
          </svg>`;
            tile.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            margin-left: 8px;
            cursor: pointer;
            user-select: none;
            color: #10A37F;            /* ChatGPT green */
            background: transparent;   /* like the others */
            border-radius: 50%;        /* fully round */
        `;
            tile.addEventListener('mouseenter', () => {
                tile.style.background = 'rgba(255,255,255,0.1)';
            });
            tile.addEventListener('mouseleave', () => {
                tile.style.background = 'transparent';
            });
            tile.onclick = () => {
                if (!panel || !panel.parentNode) createPanel();
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            };

            container.appendChild(tile);
        }

        ensureTile();
        new MutationObserver(muts => {
            for (const m of muts) {
                if (m.addedNodes.length || m.removedNodes.length) {
                    ensureTile();
                    break;
                }
            }
        }).observe(container, { childList: true });
    }

    // --- Highlight CSS ---
    const css = document.createElement('style');
    css.textContent = `
        .gpt-add-comment-btn:hover { background: rgba(49,162,76,0.12) !important; }
        .gpt-comment-highlight {
            outline: 2.5px solid #31a24c !important;
            background: rgba(49,162,76,0.07) !important;
            border-radius: 8px !important;
            transition: outline .2s, background .2s;
        }
    `;
    document.head.appendChild(css);

    // --- Init ---
    createPanel();         // Ensure panel is created FIRST
    observeComments();
    injectToggleWatcher();

})();
