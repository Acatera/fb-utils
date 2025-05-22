let comments = [];
let emptyChecks = 0;
const MAX_EMPTY_CHECKS = 10;
const processedElements = new WeakSet();

console.log('▶️ Starting full comment scraper with author + timestamp parsing...');

function hidePostMessage() {
    const postMessage = document.querySelector('[role="dialog"] div[data-ad-rendering-role="story_message"]');
    if (postMessage) postMessage.style.display = 'none';
}

function extractAuthor(el) {
    const label = el.getAttribute('aria-label') || '';
    const replyMatch = label.match(/^Reply by (.+?) to /);
    const commentMatch = label.match(/^Comment by (.+?)(?: \d| about| just now|$)/);
    return replyMatch?.[1] || commentMatch?.[1] || null;
}

function extractTimestamp(el) {
    const link = el.querySelector('a[role="link"]:not([tabindex="-1"])');
    return link?.textContent?.trim() || '';
}

function hasUnprocessedChildren(comment) {
    const allUnprocessed = Array.from(document.querySelectorAll(
        'div[role="dialog"] div[role="article"][aria-label^="Comment"], div[role="dialog"] div[role="article"][aria-label^="Reply by"]'
    )).filter(c => !processedElements.has(c));
    return allUnprocessed.some(c => c !== comment && comment.contains(c));
}

function consumeComment(comment) {
    const author = extractAuthor(comment);
    const timestamp = extractTimestamp(comment);
    const text = comment.innerText.trim();

    if (text.length > 0) {
        comments.push({ author, text, timestamp });
    }

    processedElements.add(comment);

    const parent = comment.closest('div:not([class])') ?? comment;

    if (hasUnprocessedChildren(comment)) {
        comment.style.display = 'none';
    } else {
        parent.remove();
    }

    if (comments.length % 10 === 0) {
        console.log(`✔️ Processed ${comments.length} comments...`);
    }
}

function getDeepestUnprocessedComment() {
    const all = Array.from(document.querySelectorAll(
        'div[role="dialog"] div[role="article"][aria-label^="Comment"], div[role="dialog"] div[role="article"][aria-label^="Reply by"]'
    )).filter(c => !processedElements.has(c));

    if (all.length === 0) return null;

    // Sort by DOM depth descending
    all.sort((a, b) => {
        const depth = el => {
            let d = 0;
            while (el.parentElement) {
                el = el.parentElement;
                d++;
            }
            return d;
        };
        return depth(b) - depth(a);
    });

    return all[0];
}


function getNextExpander() {
    const expanders = Array.from(document.querySelectorAll('div[role="button"], span[role="button"]')).filter(btn => {
        const text = btn.textContent?.trim();
        return (
            /^View all \d+ replies$/i.test(text) ||
            /^View \d+ reply$/i.test(text) ||
            /^View \d+ replies$/i.test(text) ||
            /^[\w\s.]+ replied$/i.test(text) ||
            /^View more replies$/i.test(text) ||
            /^Show previous replies$/i.test(text) ||
            /^View more comments$/i.test(text) ||
            /^Show previous comments$/i.test(text)
        );
    });

    return expanders[0] || null;
}

function displayTextBlock(text) {
    const textArea = document.createElement('textarea');
    textArea.style.position = 'fixed';
    textArea.style.top = '20px';
    textArea.style.left = '20px';
    textArea.style.width = '400px';
    textArea.style.height = '300px';
    textArea.style.zIndex = 9999;
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
}

function processNext() {
    const expander = getNextExpander();
    if (expander) {
        expander.click();
        setTimeout(processNext, 500);
        return;
    }

    debugger;
    const comment = getDeepestUnprocessedComment();

    if (!comment) {
        if (emptyChecks++ < MAX_EMPTY_CHECKS) {
            setTimeout(processNext, 500);
        } else {
            console.log('✅ Done scraping all visible comments.');
            console.log(comments);
            const json = JSON.stringify(comments, null, 2);
            displayTextBlock(json);
            navigator.clipboard.writeText(json);
        }
        return;
    }

    emptyChecks = 0;

    const seeMore = Array.from(comment.querySelectorAll('div[role="button"]')).find(button => {
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
        console.warn('⚠️ No React onClick for "See more":', seeMore);
        consumeComment(comment);
        setTimeout(processNext, 100);
        return;
    }

    const observer = new MutationObserver(() => {
        observer.disconnect();
        consumeComment(comment);
        setTimeout(processNext, 100);
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

hidePostMessage();
processNext();
