(async function () {
    console.log("🔍 FB Scraper v4: Full Recursive + Scroll + Logging");

    const sleep = ms => new Promise(res => setTimeout(res, ms));
    const processedKeys = new Set();
    const allData = [];

    async function scrollToBottom() {
        console.log("⏬ Scrolling to load more comments...");
        window.scrollBy(0, 1000);
        await sleep(1500);
    }

    function simulateReactClick(btn) {
        const key = Object.keys(btn).find(k => k.startsWith('__reactProps$'));
        const click = key && btn[key]?.onClick;
        if (typeof click === 'function') {
            click({ type: 'click', stopPropagation: () => {} });
            console.debug("🖱️ Clicked:", btn.textContent.trim());
            return true;
        }
        return false;
    }

    function expandAllButtons() {
        const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
        let count = 0;
        for (const btn of buttons) {
            const text = btn.textContent.trim();
            if (/see more|view all|replied|răspunsuri|afișează mai mult/i.test(text)) {
                if (simulateReactClick(btn)) count++;
            }
        }
        return count;
    }

    function extractReactions(el) {
        const spans = Array.from(el.querySelectorAll('span'));
        const reactions = spans
            .map(span => span.textContent.trim())
            .filter(text => /^\d+$/.test(text) || /👍|❤️|😂|😢|😮|😡/.test(text));
        return reactions.join(' ');
    }

    function extractTimestamp(el) {
        const guess = Array.from(el.querySelectorAll('span')).find(span => /\d+[hm]/i.test(span.textContent));
        return guess?.textContent.trim() ?? '';
    }

    function extractAuthor(el) {
        const label = el.getAttribute('aria-label') || '';
        const match =
            label.match(/Comment by (.+?) \d/) ||
            label.match(/Comment by (.+?) about/) ||
            label.match(/Comment by (.+?) just/) ||
            label.match(/Reply by (.+?) to /);
        return match?.[1] ?? 'Unknown';
    }

    function extractText(el) {
        const paragraphs = Array.from(el.querySelectorAll('*'))
            .map(e => e.textContent.trim())
            .filter(Boolean);
        return paragraphs.join(' ').replace(/\s+/g, ' ').slice(0, 1000);
    }

    function findCommentElements() {
        return Array.from(document.querySelectorAll('div[role="article"]'))
            .filter(el => {
                const text = el.innerText.trim();
                return text.length > 10;
            });
    }

    async function expandUntilStable(maxTries = 10) {
        for (let i = 0; i < maxTries; i++) {
            const expanded = expandAllButtons();
            if (expanded === 0) break;
            await sleep(1000);
        }
    }

    async function processComments() {
        let loop = 0;
        while (loop++ < 50) {
            console.log(`🔁 Loop ${loop}`);
            await scrollToBottom();
            await expandUntilStable();

            const candidates = findCommentElements();
            console.debug(`🔎 Found ${candidates.length} comment blocks`);

            for (const el of candidates) {
                try {
                    const author = extractAuthor(el);
                    const text = extractText(el);
                    const time = extractTimestamp(el);
                    const reactions = extractReactions(el);

                    const key = author + '|' + text.slice(0, 80);
                    if (processedKeys.has(key)) continue;

                    const record = { author, text, time, reactions };
                    allData.push(record);
                    processedKeys.add(key);
                    console.log("✅ Scraped:", record);

                    el.remove();
                } catch (err) {
                    console.error("❌ Error processing comment:", err);
                }
            }

            if (candidates.length === 0) {
                console.log("🛑 No more comments found.");
                break;
            }
        }
    }

    await processComments();
    console.log(`🎉 Scraping complete: ${allData.length} comments extracted.`);
    console.log("🧾 Final JSON:");
    console.log(JSON.stringify(allData, null, 2));
})();
