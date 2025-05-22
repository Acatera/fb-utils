let comments = [];
let counter = 0;
let emptyChecks = 0;
const MAX_EMPTY_CHECKS = 10;

counter++;
console.log('[Scraper] Scrape Top Comments clicked:', counter);

function hidePostMessage() {
    const postMessage = document.querySelector('[role="dialog"] div[data-ad-rendering-role="story_message"]');
    if (postMessage?.parentElement?.parentElement) {
        postMessage.parentElement.parentElement.style.display = 'none';
        return;
    }
    if (postMessage?.parentElement) {
        postMessage.parentElement.style.display = 'none';
        return;
    }
    if (postMessage) {
        postMessage.style.display = 'none';
        return;
    }
    console.warn('[Scraper] Post message not found or already hidden');
}

function deserializeCommentText(text) {
    const lines = text.split('\n');
    let name = lines[0].trim();
    let isAuthor = false;

    if (name === 'Author') {
        isAuthor = true;
        lines.shift();
        name = lines[0].trim();
    }

    if (name === 'Top fan') {
        // Skip the "Top fan" line
        lines.shift();
        name = lines[0].trim();
    }

    lines.shift();
    const hasLikes = /^\d+$/.test(lines[lines.length - 1].trim());
    let likeCount = 0;

    if (hasLikes) {
        likeCount = parseInt(lines.pop().trim(), 10);
    }

    lines.pop(); // Remove "Reply"
    lines.pop(); // Remove "Like"

    const time = lines.pop()?.trim() || '';
    const message = lines.join('\n').trim();

    return {
        isAuthor,
        name,
        message,
        time,
        likeCount
    };
}

function consumeComment(comment) {
    console.log('[Scraper] Consuming comment...');
    const commentText = comment.innerText.trim();

    if (!commentText) {
        console.warn('[Scraper] Skipping empty comment');
        return;
    }

    const commentObject = deserializeCommentText(commentText);
    if (!commentObject?.message) {
        console.warn('[Scraper] Skipping comment with no message:', commentObject);
    }
    else {
        comments.push(commentObject);
    }


    const parent = comment.closest('div:not([class])');
    if (parent) {
        parent.remove();
    }

    if (comments.length % 10 === 0) {
        console.log(`[Scraper] Processed ${comments.length} comments...`);
    }
}

function getNextComment() {
    return document.querySelector('div[role="dialog"] div[aria-label^="Comment"][role="article"]');
}

function processNext() {
    const comment = getNextComment();

    if (!comment) {
        console.log(`[Scraper] No comment found. Empty check: ${emptyChecks + 1}/${MAX_EMPTY_CHECKS}`);
        if (++emptyChecks < MAX_EMPTY_CHECKS) {
            setTimeout(processNext, 500);
        } else {
            console.log('[Scraper] Finished processing comments.');
            console.log(`[Scraper] Total comments scraped: ${comments.length}`);
            console.log(comments);
            displayTextBlock(JSON.stringify(comments, null, 2));
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
        console.log('[Scraper] No "See more" button found, consuming comment directly.');
        consumeComment(comment);
        setTimeout(processNext, 200);
        return;
    }

    console.log('[Scraper] "See more" button found. Expanding comment...');

    const key = Object.keys(seeMore).find(k => k.startsWith('__reactProps$'));
    if (!key || typeof seeMore[key]?.onClick !== 'function') {
        console.warn('[Scraper] No React onClick found for "See more" button:', seeMore);
        consumeComment(comment);
        setTimeout(processNext, 200);
        return;
    }

    const observer = new MutationObserver(() => {
        observer.disconnect();
        console.log('[Scraper] Mutation observed. Comment expanded.');
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

hidePostMessage();
processNext();
